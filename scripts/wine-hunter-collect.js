#!/usr/bin/env node
/**
 * Wine Hunter v4.0 - Ultra-Conservative Verification
 * 
 * RULES:
 * 1. NEVER report a deal without visiting the product page
 * 2. ONLY report verified: price, vintage, bottle size, availability
 * 3. If ANY doubt → flag as "needs manual verification"
 * 4. 750ml is default — magnums/halves must be EXPLICITLY confirmed
 * 5. "Notify me" / "Pre-arrival" / "Sold out" = NOT available
 */

const { execSync } = require('child_process');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const ALERT_FILE = '/data/workspace/memory/wine-deal-alerts.md';
const WORK_DIR = '/data/workspace/memory/wine-hunts';
mkdirSync(WORK_DIR, { recursive: true });

// === TARGET WINES (Kill List) ===
const TARGET_WINES = [
  { producer: 'Allemand', wine: 'Reynard', vintages: ['2011', '2014'], maxPrice: 450, priority: 'UNICORN' },
  { producer: 'Allemand', wine: 'Chaillot', vintages: ['2011', '2014'], maxPrice: 400, priority: 'UNICORN' },
  { producer: 'Clape', wine: 'Cornas', vintages: ['2013', '2014'], maxPrice: 280, priority: 'HIGH' },
  { producer: 'Leoville Barton', wine: '', vintages: ['2009', '2010'], maxPrice: 220, priority: 'HIGH' },
  { producer: 'Montrose', wine: '', vintages: ['2005', '2009', '2010'], maxPrice: 280, priority: 'HIGH' },
];

// Major retailers to prioritize
const TRUSTED_RETAILERS = [
  'klwines.com', 'wine.com', 'vivino.com', 'wine-searcher.com',
  'k-and-l-wine', 'craftandcork', 'jjbuckley.com', 'winebid.com',
  'cellartracker.com', 'morrellwine.com', 'crushwineco.com'
];

/**
 * Search for a wine using Tavily
 */
function searchWine(target) {
  const wineName = target.wine ? `${target.producer} ${target.wine}` : target.producer;
  const queries = target.vintages.map(v => `${wineName} ${v} price buy in stock`);
  
  const allResults = [];
  
  for (const query of queries) {
    try {
      console.log(`  Searching: ${query}`);
      // Use double quotes and escape internal quotes properly
      const escapedQuery = query.replace(/"/g, '\\"');
      const result = execSync(
        `cd /data/workspace && node skills/tavily-search/scripts/search.mjs "${escapedQuery}" -n 8`,
        { encoding: 'utf-8', timeout: 60000 }
      );
      
      // Parse Tavily results - looking for URL patterns
      const lines = result.split('\n');
      let currentUrl = null;
      let currentTitle = '';
      let currentContent = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for URL line
        if (line.startsWith('http://') || line.startsWith('https://')) {
          if (currentUrl) {
            allResults.push({ 
              url: currentUrl, 
              title: currentTitle.trim(), 
              snippet: currentContent.trim() 
            });
          }
          currentUrl = line.trim();
          currentTitle = '';
          currentContent = '';
        } else if (line.startsWith('**') && line.includes('**')) {
          // Title line in markdown
          currentTitle = line.replace(/\*\*/g, '').trim();
        } else if (line.trim() && !line.startsWith('---')) {
          currentContent += line + ' ';
        }
      }
      
      if (currentUrl) {
        allResults.push({ 
          url: currentUrl, 
          title: currentTitle.trim(), 
          snippet: currentContent.trim() 
        });
      }
      
      // Rate limit
      execSync('sleep 2');
    } catch (e) {
      console.log(`  Search error: ${e.message}`);
    }
  }
  
  // Remove duplicates and prioritize trusted retailers
  const seen = new Set();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).sort((a, b) => {
    const aTrusted = TRUSTED_RETAILERS.some(r => a.url.includes(r)) ? 1 : 0;
    const bTrusted = TRUSTED_RETAILERS.some(r => b.url.includes(r)) ? 1 : 0;
    return bTrusted - aTrusted;
  });
}

/**
 * Fetch a product page using curl
 */
function fetchPage(url) {
  const cacheFile = path.join(WORK_DIR, `page_${Buffer.from(url).toString('base64').substring(0, 20)}.txt`);
  
  try {
    // Use curl with browser headers
    const result = execSync(
      `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
        -H "Accept-Language: en-US,en;q=0.5" \
        --max-time 25 --retry 1 \
        "${url}" 2>/dev/null || echo ""`,
      { encoding: 'utf-8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
    );
    
    if (result && result.length > 500) {
      return result;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Verify a product page for wine details
 */
function verifyProductPage(url, target) {
  const wineName = target.wine ? `${target.producer} ${target.wine}` : target.producer;
  
  console.log(`    🔍 Verifying: ${url.substring(0, 60)}...`);
  
  const pageContent = fetchPage(url);
  
  if (!pageContent || pageContent.length < 500) {
    return { verified: false, reason: 'Could not fetch page' };
  }
  
  const text = pageContent.toLowerCase();
  const pageUpper = pageContent;
  const producerLower = target.producer.toLowerCase();
  const wineWord = target.wine ? target.wine.toLowerCase() : '';
  
  // Check if page actually mentions the wine
  const hasProducer = text.includes(producerLower);
  const hasWine = wineWord ? text.includes(wineWord) : true;
  
  if (!hasProducer) {
    return { verified: false, reason: 'Wine not mentioned on page' };
  }
  
  // Find vintage - must be explicit
  let foundVintage = null;
  for (const vintage of target.vintages) {
    // Look for vintage as whole word
    const vintagePattern = new RegExp(`\\b${vintage}\\b`);
    if (vintagePattern.test(pageUpper)) {
      foundVintage = vintage;
      break;
    }
  }
  
  if (!foundVintage) {
    return { verified: false, reason: 'Target vintage not found' };
  }
  
  // === BOTTLE SIZE DETECTION ===
  // Default: 750ml. Must find EXPLICIT evidence for other sizes.
  let bottleSize = '750ml';
  let sizeConfidence = 'assumed';
  let sizeContext = '';
  
  // Check for explicit size mentions
  const has1_5L = /\b1\.5\s*[Ll]\b/.test(pageUpper) || 
                  /\bmagnum\b/i.test(pageUpper) ||
                  /1500\s*[Mm][Ll]/.test(pageUpper);
  
  const has375 = /\b375\s*[Mm][Ll]\b/.test(pageUpper) ||
                 /\bhalf[-\s]?bottle\b/i.test(pageUpper);
  
  const has750 = /\b750\s*[Mm][Ll]\b/.test(pageUpper) ||
                 /\b75\s*[Cc][Ll]\b/.test(pageUpper);
  
  if (has1_5L) {
    bottleSize = '1.5L (Magnum)';
    sizeConfidence = 'explicit';
    sizeContext = 'Found: 1.5L/magnum/1500ml mention';
  } else if (has375) {
    bottleSize = '375ml (Half)';
    sizeConfidence = 'explicit';
    sizeContext = 'Found: 375ml/half-bottle mention';
  } else if (has750) {
    sizeConfidence = 'confirmed';
    sizeContext = 'Found: 750ml/75cl mention';
  }
  
  // === PRICE EXTRACTION ===
  // Look for prices, be conservative
  let price = null;
  let priceContext = '';
  
  // Find all dollar amounts
  const priceMatches = [...pageUpper.matchAll(/\$([\d,]+\.?\d{0,2})\b/g)];
  const prices = priceMatches
    .map(m => ({ price: parseFloat(m[1].replace(/,/g, '')), index: m.index }))
    .filter(p => p.price > 15 && p.price < 5000);
  
  if (prices.length === 0) {
    return { verified: false, reason: 'No prices found' };
  }
  
  // If only one price, use it
  if (prices.length === 1) {
    price = prices[0].price;
    priceContext = 'Single price on page';
  } else {
    // Multiple prices - look for context
    // Try to find price near vintage or producer
    const producerIndex = text.indexOf(producerLower);
    let bestPrice = prices[0];
    let minDist = Infinity;
    
    for (const p of prices) {
      const dist = Math.abs(p.index - producerIndex);
      if (dist < minDist && dist < 2000) { // Within reasonable proximity
        minDist = dist;
        bestPrice = p;
      }
    }
    
    price = bestPrice.price;
    priceContext = `Multiple prices, selected nearest to wine mention (${prices.length} total)`;
  }
  
  // === AVAILABILITY CHECK ===
  const unavailableTerms = [
    'out of stock', 'sold out', 'unavailable', 'notify me',
    'notify when', 'coming soon', 'pre-arrival', 'pre-order',
    'waitlist', 'join waitlist', 'backorder', 'temporarily unavailable'
  ];
  
  const availableTerms = [
    'in stock', 'add to cart', 'buy now', 'ships today',
    'available now', 'ships now', 'ships within', 'ships immediately'
  ];
  
  let isAvailable = null;
  let availabilityNote = '';
  
  for (const term of unavailableTerms) {
    if (text.includes(term)) {
      isAvailable = false;
      availabilityNote = `Found: "${term}"`;
      break;
    }
  }
  
  if (isAvailable !== false) {
    for (const term of availableTerms) {
      if (text.includes(term)) {
        isAvailable = true;
        availabilityNote = `Found: "${term}"`;
        break;
      }
    }
  }
  
  // Conservative: unclear availability = not verified
  if (isAvailable === null) {
    return {
      verified: false,
      reason: 'Availability unclear',
      partial: { wine: wineName, vintage: foundVintage, price, bottleSize, sizeConfidence }
    };
  }
  
  if (!isAvailable) {
    return { verified: false, reason: `Unavailable: ${availabilityNote}` };
  }
  
  return {
    verified: true,
    wine: wineName,
    vintage: foundVintage,
    price: price,
    bottleSize: bottleSize,
    sizeConfidence: sizeConfidence,
    sizeContext: sizeContext,
    priceContext: priceContext,
    availabilityNote: availabilityNote,
    url: url
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 WINE HUNTER v4.0 — Conservative Verification');
  console.log('   Principle: Verify or flag. Never guess.\n');
  
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const verifiedDeals = [];
  const needsVerification = [];
  const checkedUrls = new Set();
  
  for (const target of TARGET_WINES) {
    const wineName = target.wine ? `${target.producer} ${target.wine}` : target.producer;
    console.log(`\n🍷 ${wineName} (${target.vintages.join(', ')}) — max $${target.maxPrice}`);
    
    const results = searchWine(target);
    console.log(`   ${results.length} unique results to check`);
    
    let foundVerified = 0;
    let checked = 0;
    
    for (const result of results) {
      if (checked >= 5) break; // Max 5 pages per wine
      if (checkedUrls.has(result.url)) continue;
      
      checkedUrls.add(result.url);
      checked++;
      
      // Quick pre-filter from snippet
      const snippet = (result.snippet || '').toLowerCase();
      const title = (result.title || '').toLowerCase();
      const producerLower = target.producer.toLowerCase();
      
      if (!snippet.includes(producerLower) && !title.includes(producerLower)) {
        continue;
      }
      
      // Verify the page
      const verification = verifyProductPage(result.url, target);
      
      if (verification.verified) {
        // Check if it's a deal
        const isStandardBottle = verification.bottleSize === '750ml';
        const isUnderMax = verification.price <= target.maxPrice;
        
        if (isStandardBottle && isUnderMax) {
          verifiedDeals.push({
            ...verification,
            priority: target.priority,
            maxPrice: target.maxPrice
          });
          console.log(`   ✅ VERIFIED: ${verification.vintage} at $${verification.price}`);
          foundVerified++;
        } else if (isUnderMax) {
          // Good price but unusual size
          needsVerification.push({
            wine: verification.wine,
            vintage: verification.vintage,
            price: verification.price,
            bottleSize: verification.bottleSize,
            sizeConfidence: verification.sizeConfidence,
            url: result.url,
            note: `Price OK ($${verification.price}) but bottle is ${verification.bottleSize} (${verification.sizeConfidence})`
          });
          console.log(`   ⚠️ SIZE CHECK: ${verification.vintage} at $${verification.price} — ${verification.bottleSize}`);
        } else {
          console.log(`   ℹ️ Too expensive: $${verification.price} (max $${target.maxPrice})`);
        }
      } else if (verification.partial) {
        needsVerification.push({
          wine: wineName,
          vintage: verification.partial.vintage,
          price: verification.partial.price,
          bottleSize: verification.partial.bottleSize,
          url: result.url,
          note: `Partial: ${verification.reason}. Price $${verification.partial.price}, Size: ${verification.partial.bottleSize}`
        });
        console.log(`   ⚠️ PARTIAL: ${verification.reason}`);
      } else {
        console.log(`   ❌ ${verification.reason}`);
      }
      
      execSync('sleep 3');
    }
    
    if (foundVerified === 0) {
      console.log(`   No verified deals`);
    }
  }
  
  // Generate report
  let report = `# 🍷 WINE HUNT REPORT — ${timestamp} ET\n\n`;
  report += `*Verified deals only — ambiguous results flagged for manual review*\n\n`;
  
  // UNICORNS
  const unicorns = verifiedDeals.filter(d => d.priority === 'UNICORN');
  const highPri = verifiedDeals.filter(d => d.priority === 'HIGH');
  
  if (unicorns.length > 0) {
    report += `## 🦄 UNICORN FINDS (VERIFIED IN STOCK)\n\n`;
    for (const d of unicorns) {
      report += `**${d.wine} ${d.vintage}** — $${d.price}\n`;
      report += `- Bottle: ${d.bottleSize} (${d.sizeConfidence})\n`;
      report += `- URL: ${d.url}\n\n`;
    }
  }
  
  if (highPri.length > 0) {
    report += `## 🎯 HIGH PRIORITY (VERIFIED IN STOCK)\n\n`;
    for (const d of highPri) {
      report += `**${d.wine} ${d.vintage}** — $${d.price}\n`;
      report += `- Bottle: ${d.bottleSize} (${d.sizeConfidence})\n`;
      report += `- URL: ${d.url}\n\n`;
    }
  }
  
  if (needsVerification.length > 0) {
    report += `## ⚠️ NEEDS MANUAL CHECK\n\n`;
    for (const item of needsVerification) {
      report += `**${item.wine} ${item.vintage || ''}** — $${item.price || '???'}\n`;
      if (item.bottleSize) report += `- Bottle: ${item.bottleSize}\n`;
      report += `- URL: ${item.url}\n`;
      report += `- Why: ${item.note}\n\n`;
    }
  }
  
  if (verifiedDeals.length === 0 && needsVerification.length === 0) {
    report += `## 📭 No verified deals today.\n\n`;
    report += `The hunt continues...\n`;
  }
  
  report += `\n---\n`;
  report += `*750ml assumed standard unless explicitly marked otherwise*\n`;
  report += `*"Notify me", "Pre-arrival", "Sold out" filtered as unavailable*\n`;
  
  writeFileSync(ALERT_FILE, report);
  
  console.log('\n' + '='.repeat(50));
  console.log(report);
  console.log('='.repeat(50));
  console.log(`\nReport saved to: ${ALERT_FILE}`);
  
  process.exit(verifiedDeals.length > 0 ? 0 : 1);
}

// Error handler
process.on('uncaughtException', (e) => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});

main();
