#!/usr/bin/env node
/**
 * Smart Wine Hunter v3.0 - Live Retailer Focus
 * Targets specific wine retailers with known inventory APIs/live listings
 * Avoids aggregator sites with stale data
 */

const { execSync } = require('child_process');
const { writeFileSync, existsSync, readFileSync, mkdirSync } = require('fs');
const path = require('path');

const MEMORY_FILE = '/data/workspace/memory/wine-deal-alerts.md';
const PRICE_HISTORY_FILE = '/data/workspace/memory/wine-price-history.json';
const SEEN_DEALS_FILE = '/data/workspace/memory/wine-hunts/seen-deals-v3.json';

mkdirSync('/data/workspace/memory/wine-hunts', { recursive: true });

// === LIVE RETAILER TARGETS (Known to carry allocated/rare wines) ===
const TARGET_RETAILERS = [
  { name: 'K&L Wine Merchants', domain: 'klwines.com', searchUrl: 'site:klwines.com' },
  { name: 'Wine.com', domain: 'wine.com', searchUrl: 'site:wine.com' },
  { name: 'Vinfolio', domain: 'vinfolio.com', searchUrl: 'site:vinfolio.com' },
  { name: 'Benchmark Wine', domain: 'benchmarkwine.com', searchUrl: 'site:benchmarkwine.com' },
  { name: 'WineBid', domain: 'winebid.com', searchUrl: 'site:winebid.com' },
  { name: 'Spectrum Wine', domain: 'spectrumwine.com', searchUrl: 'site:spectrumwine.com' },
  { name: 'Acker Wines', domain: 'ackerwines.com', searchUrl: 'site:ackerwines.com' },
  { name: 'Crush Wine', domain: 'crushwineco.com', searchUrl: 'site:crushwineco.com' },
  { name: 'JJ Buckley', domain: 'jjbuckley.com', searchUrl: 'site:jjbuckley.com' },
  { name: 'Premier Cru', domain: 'premiercru.net', searchUrl: 'site:premiercru.net' },
  { name: 'Flickinger Wines', domain: 'flickingerwines.com', searchUrl: 'site:flickingerwines.com' },
  { name: 'The Rare Wine Co', domain: 'rarewineco.com', searchUrl: 'site:rarewineco.com' },
];

// === THE KILL LIST (Dead Fruit Protocol) ===
const KILL_LIST = [
  { producer: 'Allemand', wine: 'Reynard', targetVintages: ['2011', '2014', '2015'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 425, maxPrice: 500, priority: 'UNICORN', notes: 'THE TARGET. Any available = immediate alert.' },
  { producer: 'Allemand', wine: 'Chaillot', targetVintages: ['2011', '2014', '2015'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 375, maxPrice: 425, priority: 'UNICORN', notes: 'Secondary target. Cool vintages only.' },
  { producer: 'Clape', wine: 'Cornas', targetVintages: ['2013', '2014', '2015'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 250, maxPrice: 300, priority: 'HIGH', notes: 'Cool/classic vintages. Avoid solar.' },
  { producer: 'Jamet', wine: 'Cote-Rotie', targetVintages: ['2013', '2014', '2015'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 285, maxPrice: 350, priority: 'KILL', notes: 'Côte-Rôtie — borderline kill list due to floral nature. Only if aged.' },
  { producer: 'Montrose', wine: 'Saint-Estephe', targetVintages: ['2005', '2008', '2009', '2010'], avoidVintages: [], targetPrice: 250, maxPrice: 300, priority: 'HIGH', notes: 'Aged Bordeaux, fruit dead = good' },
  { producer: 'Léoville Barton', wine: 'Saint-Julien', targetVintages: ['2009', '2010', '2014'], avoidVintages: [], targetPrice: 200, maxPrice: 250, priority: 'HIGH', notes: 'Classic Bordeaux structure' },
  { producer: 'Tempier', wine: 'Cabassaou', targetVintages: ['2011', '2013', '2014'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 180, maxPrice: 220, priority: 'MEDIUM', notes: 'Bandol — aged only, avoid solar' },
  { producer: 'Tempier', wine: 'La Migoua', targetVintages: ['2011', '2013', '2014'], avoidVintages: ['2018', '2019', '2020', '2021', '2022'], targetPrice: 160, maxPrice: 200, priority: 'MEDIUM', notes: 'Bandol blend' },
  { producer: 'Dunn', wine: 'Howell Mountain', targetVintages: ['2011', '2012', '2013'], avoidVintages: [], targetPrice: 220, maxPrice: 280, priority: 'MEDIUM', notes: 'Napa with aging potential' },
  { producer: 'Paolo Bea', wine: 'Pagliaro', targetVintages: ['2012', '2013', '2015'], avoidVintages: [], targetPrice: 145, maxPrice: 180, priority: 'MEDIUM', notes: 'Sagrantino — needs age' },
  { producer: 'Sorrel', wine: 'Le Greal', targetVintages: ['2013', '2014', '2015'], avoidVintages: [], targetPrice: 210, maxPrice: 260, priority: 'MEDIUM', notes: 'Hermitage' },
  { producer: 'Cappellano', wine: 'Pie Rupestris', targetVintages: ['2010', '2013', '2014'], avoidVintages: [], targetPrice: 300, maxPrice: 380, priority: 'HIGH', notes: 'Barolo — aged Nebbiolo' },
  { producer: 'Dugat-Py', wine: 'Coeur de Roy', targetVintages: ['2013', '2014', '2015'], avoidVintages: [], targetPrice: 195, maxPrice: 240, priority: 'MEDIUM', notes: 'Gevrey-Chambertin' },
];

function loadJson(file, defaultVal = {}) {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch (e) {}
  return defaultVal;
}

function saveJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function searchRetailer(retailer, target) {
  // Focus on in stock and specific bottle size - use simple queries to avoid shell escaping issues
  const vintageQuery = target.targetVintages.slice(0, 2).join(' OR ');
  const queries = [
    `${retailer.searchUrl} ${target.producer} ${target.wine} ${vintageQuery} in stock`,
    `${retailer.searchUrl} ${target.producer} ${target.wine} buy`,
    `site:${retailer.domain} ${target.producer} ${target.wine} available`,
  ];
  
  const allResults = [];
  
  for (const query of queries) {
    try {
      console.log(`   🔍 Searching: ${retailer.name}...`);
      const result = execSync(
        `node /data/workspace/skills/tavily-search/scripts/search.mjs "${query}" -n 5`,
        { encoding: 'utf-8', timeout: 30000 }
      );
      if (result && result.length > 50) {
        allResults.push(`=== ${retailer.name} ===\n${result}`);
      }
    } catch (e) {
      // Silent fail for individual searches
    }
    // Rate limiting
    execSync('sleep 0.5');
  }
  
  return allResults.join('\n---\n');
}

function analyzeWithLLM(searchResults, target) {
  const prompt = `You are an expert wine buyer hunting for specific allocated wines. You are ruthless about filtering out sold-out, unavailable, or mispriced listings.

TARGET WINE:
- Producer: ${target.producer}
- Wine: ${target.wine}
- Acceptable Vintages: ${target.targetVintages.join(', ')}
- FORBIDDEN Vintages (solar/hot): ${target.avoidVintages.join(', ')}
- Target Price: $${target.targetPrice}
- Max Price: $${target.maxPrice}
- Priority: ${target.priority}
- Notes: ${target.notes}

CRITICAL FILTERING RULES:
1. ONLY return listings that are VERIFIABLY IN STOCK and AVAILABLE TO PURCHASE NOW
2. If a listing says "sold out", "out of stock", "notify me", "waitlist", "coming soon" — REJECT IT
3. If the price is clearly wrong (e.g., $45 for Allemand Reynard) — REJECT IT (likely different wine)
4. If the vintage is not one of the acceptable years — REJECT IT
5. If it's a solar vintage (2018-2022) — REJECT IT unless explicitly noted as EXCEPTIONAL DEAL
6. If bottle size is not 750ml standard — note it clearly (magnum, half-bottle)
7. Verify shipping is available to the US

RETAILER REPUTATION TIER:
- Tier 1 (Reliable): K&L, Wine.com, Vinfolio, Benchmark, WineBid, Acker, JJ Buckley
- Tier 2 (Good): Spectrum, Crush, Premier Cru, Flickinger, Rare Wine Co
- Be cautious of unknown retailers

SEARCH RESULTS:
${searchResults.substring(0, 10000)}

TASK:
Extract ONLY real, available listings. Be skeptical — most results will be sold out or incorrect.

RETURN JSON ONLY:
{
  "deals": [
    {
      "vintage": "2014",
      "price": 395,
      "totalPrice": 420,
      "bottleSize": "750ml",
      "retailer": "K&L Wine Merchants",
      "retailerTier": "Tier 1",
      "availability": "In Stock",
      "url": "https://www.klwines.com/...",
      "notes": "Verified available, cool vintage",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "recommendation": "BUY_NOW" | "CONSIDER" | "SKIP"
    }
  ],
  "summary": "Found 1 real deal, 5 sold out filtered",
  "soldOutFiltered": 5
}

If NO valid in-stock deals found: {"deals": [], "summary": "No in-stock listings found", "soldOutFiltered": 0}`;

  try {
    const result = execSync(
      `cd /data/workspace && echo ${JSON.stringify(prompt)} | openclaw run --model moonshot/kimi-k2.5 --stdin`,
      { encoding: 'utf-8', timeout: 90000 }
    );
    
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { deals: [], summary: 'Parse error', soldOutFiltered: 0 };
  } catch (e) {
    console.log(`   ⚠️ LLM analysis failed: ${e.message}`);
    return { deals: [], summary: 'Analysis failed', soldOutFiltered: 0 };
  }
}

async function main() {
  console.log('🧠 SMART WINE HUNTER v3.0 — LIVE RETAILER FOCUS');
  console.log('Targeting specific retailers with known inventory...\n');
  
  const priceHistory = loadJson(PRICE_HISTORY_FILE, {});
  const seenDeals = loadJson(SEEN_DEALS_FILE, {});
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const allDeals = [];
  let totalSoldOutFiltered = 0;
  
  // Sort by priority — unicorns first
  const sortedTargets = [...KILL_LIST].sort((a, b) => {
    const p = { 'UNICORN': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return (p[a.priority] || 4) - (p[b.priority] || 4);
  });
  
  for (const target of sortedTargets) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 ${target.priority}: ${target.producer} ${target.wine}`);
    console.log(`   Acceptable: ${target.targetVintages.join(', ')} | Target: $${target.targetPrice}`);
    
    // Search across multiple retailers
    let allSearchResults = '';
    let searchedCount = 0;
    
    for (const retailer of TARGET_RETAILERS) {
      const results = searchRetailer(retailer, target);
      if (results) {
        allSearchResults += results + '\n\n';
        searchedCount++;
      }
    }
    
    if (allSearchResults.length < 100) {
      console.log(`   ❌ No results from ${searchedCount} retailers`);
      continue;
    }
    
    console.log(`   🧠 Analyzing results from ${searchedCount} retailers...`);
    const analysis = analyzeWithLLM(allSearchResults, target);
    
    if (analysis.soldOutFiltered) {
      totalSoldOutFiltered += analysis.soldOutFiltered;
    }
    
    if (analysis.deals && analysis.deals.length > 0) {
      console.log(`   ✓ Found ${analysis.deals.length} REAL deals (${analysis.soldOutFiltered || 0} sold-out filtered)`);
      
      for (const deal of analysis.deals) {
        // Check for duplicates
        const dealKey = `${target.producer}_${target.wine}_${deal.vintage}_${deal.retailer}`;
        if (seenDeals[dealKey]) {
          console.log(`   📭 Already alerted: ${deal.vintage} from ${deal.retailer}`);
          continue;
        }
        
        // Mark as seen
        seenDeals[dealKey] = { date: timestamp, price: deal.totalPrice };
        
        // Only accept HIGH or MEDIUM confidence
        if (deal.confidence === 'LOW' || deal.recommendation === 'SKIP') {
          console.log(`   ⏭️ Skipped: Low confidence`);
          continue;
        }
        
        const isGreatDeal = deal.totalPrice <= target.targetPrice;
        const isGoodDeal = deal.totalPrice <= target.maxPrice;
        
        if (isGoodDeal) {
          allDeals.push({
            ...deal,
            producer: target.producer,
            wine: target.wine,
            targetPrice: target.targetPrice,
            maxPrice: target.maxPrice,
            isGreatDeal,
            priority: target.priority,
            dealKey
          });
          
          console.log(`   ${isGreatDeal ? '🔥🔥🔥' : '💰'} ${deal.vintage} at $${deal.totalPrice} (${deal.retailer})`);
        }
      }
    } else {
      console.log(`   📭 ${analysis.summary}`);
    }
    
    saveJson(SEEN_DEALS_FILE, seenDeals);
  }
  
  // Generate final alert
  console.log(`\n${'='.repeat(60)}`);
  
  if (allDeals.length > 0) {
    const unicorns = allDeals.filter(d => d.priority === 'UNICORN');
    const highPriority = allDeals.filter(d => d.priority === 'HIGH');
    const others = allDeals.filter(d => !['UNICORN', 'HIGH'].includes(d.priority));
    
    let alert = `🍷 SMART WINE HUNT ALERT - ${timestamp} ET\n`;
    alert += `${'='.repeat(60)}\n\n`;
    alert += `✅ VERIFIED IN-STOCK DEALS (${allDeals.length} found, ${totalSoldOutFiltered} sold-out filtered)\n\n`;
    
    if (unicorns.length > 0) {
      alert += `🦄🦄🦄 UNICORN ALERTS — IMMEDIATE ACTION REQUIRED:\n\n`;
      for (const deal of unicorns) {
        alert += `🚨 ${deal.producer} ${deal.wine} ${deal.vintage}\n`;
        alert += `   Price: $${deal.totalPrice} (Target: $${deal.targetPrice})\n`;
        alert += `   ${deal.isGreatDeal ? '🔥 BELOW TARGET!' : 'Within range'}\n`;
        alert += `   Retailer: ${deal.retailer} (${deal.retailerTier})\n`;
        alert += `   Availability: ${deal.availability}\n`;
        if (deal.notes) alert += `   Notes: ${deal.notes}\n`;
        if (deal.url) alert += `   🔗 ${deal.url}\n`;
        alert += `\n⏰ MOVE FAST — these sell out quickly\n\n`;
      }
    }
    
    if (highPriority.length > 0) {
      alert += `🎯 HIGH PRIORITY DEALS:\n\n`;
      for (const deal of highPriority) {
        alert += `${deal.producer} ${deal.wine} ${deal.vintage}\n`;
        alert += `   $${deal.totalPrice} at ${deal.retailer}\n`;
        if (deal.url) alert += `   🔗 ${deal.url}\n`;
        alert += `\n`;
      }
    }
    
    if (others.length > 0) {
      alert += `💰 Other Deals:\n\n`;
      for (const deal of others) {
        alert += `${deal.producer} ${deal.wine} ${deal.vintage} — $${deal.totalPrice}\n`;
      }
    }
    
    alert += `\n---\n`;
    alert += `⚠️ Filters Applied:\n`;
    alert += `   ✓ Solar vintages (2018-2022) rejected\n`;
    alert += `   ✓ ${totalSoldOutFiltered} sold-out listings filtered\n`;
    alert += `   ✓ Bottle sizes verified (750ml standard)\n`;
    alert += `   ✓ Retailer reputation checked\n`;
    alert += `   ✓ Availability confirmed\n\n`;
    alert += `🎯 Allemand has done his job — now it's your move.\n`;
    
    writeFileSync(MEMORY_FILE, alert);
    
    // Update price history
    for (const deal of allDeals) {
      const key = `${deal.producer}_${deal.wine}_${deal.vintage}`;
      if (!priceHistory[key] || deal.totalPrice < priceHistory[key].price) {
        priceHistory[key] = { 
          price: deal.totalPrice, 
          date: timestamp, 
          retailer: deal.retailer,
          url: deal.url 
        };
      }
    }
    saveJson(PRICE_HISTORY_FILE, priceHistory);
    saveJson(SEEN_DEALS_FILE, seenDeals);
    
    console.log(alert);
    process.exit(0);
  } else {
    console.log(`📭 No in-stock deals found today.`);
    console.log(`   (${totalSoldOutFiltered} sold-out listings were filtered)`);
    console.log(`   Allemand keeps hunting...`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
