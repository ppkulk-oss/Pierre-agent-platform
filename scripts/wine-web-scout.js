#!/usr/bin/env node
/**
 * Wine Web Scout - Website Monitoring System
 * Scrapes key retailer websites for stock availability
 * Focus on Northern Rhône allocations
 * 
 * Run: node scripts/wine-web-scout.js [--full]
 * --full: Also check tier 2 retailers
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MEMORY_DIR = '/data/workspace/memory';
const LOG_DIR = '/data/workspace/logs';
const CONFIG_FILE = '/data/workspace/config/wine-warfare.json';

mkdirSync(LOG_DIR, { recursive: true });

// Load config
let config = { targetWines: { highPriority: [], mediumPriority: [] } };
try {
  config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
} catch (e) {
  console.log('Warning: Could not load config, using defaults');
}

// Combine all target wines
const allTargetWines = [
  ...config.targetWines.highPriority || [],
  ...config.targetWines.mediumPriority || [],
  ...config.targetWines.opportunistic || []
];

// Retailer URL patterns to check
const RETAILER_URLS = {
  tier1: [
    {
      name: 'Kermit Lynch',
      searchUrls: [
        'https://www.kermitlynch.com/search?q=gonon',
        'https://www.kermitlynch.com/search?q=clape',
        'https://www.kermitlynch.com/search?q=allemand',
      ],
      directUrls: [
        'https://www.kermitlynch.com/collections/all?sort_by=created-descending',
      ]
    },
    {
      name: 'Crush Wine',
      searchUrls: [
        'https://www.crushwineco.com/search?q=allemand',
        'https://www.crushwineco.com/search?q=clape',
        'https://www.crushwineco.com/search?q=chave',
      ],
    },
    {
      name: 'Rare Wine Co',
      searchUrls: [
        'https://www.rarewineco.com/search?q=gonon',
        'https://www.rarewineco.com/search?q=allemand',
        'https://www.rarewineco.com/search?q=clape',
      ],
    },
    {
      name: 'SommPicks',
      searchUrls: [
        'https://www.sommpicks.com/search?q=allemand',
        'https://www.sommpicks.com/search?q=clape',
        'https://www.sommpicks.com/search?q=gonon',
      ],
    },
  ],
  tier2: [
    {
      name: 'K&L Wine',
      searchUrls: [
        'https://www.klwines.com/search?text=chave&se',
        'https://www.klwines.com/search?text=rostaing&se',
      ],
    },
    {
      name: 'Flatiron Wines',
      searchUrls: [
        'https://flatiron-wines.com/search?q=clape',
        'https://flatiron-wines.com/search?q=rostaing',
      ],
    },
  ]
};

// In-stock indicators to look for in page content
const STOCK_INDICATORS = [
  /add to cart/i,
  /in stock/i,
  /available/i,
  /\$\d{2,4}\.\d{2}/,  // Price pattern
  /buy now/i,
  /quick view/i,
];

// Sold out indicators
const SOLD_OUT_INDICATORS = [
  /sold out/i,
  /out of stock/i,
  /unavailable/i,
  /coming soon/i,
  /notify me/i,
];

function log(category, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${category}] ${message}`;
  console.log(line);
  
  const logFile = join(LOG_DIR, `web-scout-${new Date().toISOString().split('T')[0]}.log`);
  writeFileSync(logFile, line + '\n', { flag: 'a' });
}

async function fetchPage(url) {
  try {
    // Use curl for fetching with proper headers
    const { execSync } = await import('child_process');
    const result = execSync(
      `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
       -H "Accept: text/html" \
       --connect-timeout 10 \
       --max-time 15 \
       "${url}" 2>/dev/null | head -c 50000`,
      { encoding: 'utf-8', timeout: 20000 }
    );
    return result;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

function analyzePage(content, wineName) {
  const text = content.toLowerCase();
  const wineNameLower = wineName.toLowerCase();
  
  // Check if wine is mentioned
  const wineMentioned = text.includes(wineNameLower.split(' ')[0]) || 
                        text.includes(wineNameLower.split(' ').slice(-1)[0]);
  
  if (!wineMentioned) {
    return { found: false, status: 'not_mentioned' };
  }
  
  // Check for stock indicators
  const hasStock = STOCK_INDICATORS.some(pattern => pattern.test(text));
  const isSoldOut = SOLD_OUT_INDICATORS.some(pattern => pattern.test(text));
  
  // Extract price if available
  const priceMatch = text.match(/\$(\d{2,4})\.?\d{0,2}/);
  const price = priceMatch ? `$${priceMatch[1]}` : null;
  
  return {
    found: true,
    status: isSoldOut ? 'sold_out' : (hasStock ? 'in_stock' : 'unknown'),
    price,
    confidence: hasStock ? 'high' : (isSoldOut ? 'high' : 'low')
  };
}

async function checkRetailer(retailer, wines) {
  log('CHECK', `Scanning ${retailer.name}...`);
  
  const findings = [];
  
  for (const url of retailer.searchUrls || retailer.directUrls || []) {
    try {
      const content = await fetchPage(url);
      
      if (content.startsWith('ERROR')) {
        log('ERROR', `${retailer.name}: ${content}`);
        continue;
      }
      
      for (const wine of wines) {
        const analysis = analyzePage(content, wine.name);
        
        if (analysis.found) {
          findings.push({
            wine: wine.name,
            wineId: wine.id,
            retailer: retailer.name,
            status: analysis.status,
            price: analysis.price,
            confidence: analysis.confidence,
            url: url,
            priority: wine.priority || 'LOW'
          });
          
          if (analysis.status === 'in_stock') {
            log('FIND', `🍷 ${wine.name} at ${retailer.name}: ${analysis.price || 'Price unknown'}`);
          }
        }
      }
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      log('ERROR', `${retailer.name}: ${err.message}`);
    }
  }
  
  return findings;
}

function generateReport(allFindings) {
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  allFindings.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  const inStock = allFindings.filter(f => f.status === 'in_stock');
  const soldOut = allFindings.filter(f => f.status === 'sold_out');
  
  let report = `# 🌐 Web Scout Report - ${timestamp} ET\n\n`;
  
  if (inStock.length > 0) {
    report += `## 🔴 IN STOCK (${inStock.length} wines)\n\n`;
    report += `| Wine | Retailer | Price | Priority |\n`;
    report += `|------|----------|-------|----------|\n`;
    
    for (const f of inStock) {
      const emoji = f.priority === 'HIGH' ? '🔴' : f.priority === 'MEDIUM' ? '🟡' : '🟢';
      report += `| ${emoji} ${f.wine} | ${f.retailer} | ${f.price || 'TBD'} | ${f.priority} |\n`;
    }
    report += `\n`;
  }
  
  if (soldOut.length > 0) {
    report += `## ⚠️ Found but Sold Out (${soldOut.length} wines)\n\n`;
    report += `| Wine | Retailer | Last Price |\n`;
    report += `|------|----------|------------|\n`;
    
    for (const f of soldOut.slice(0, 10)) {
      report += `| ${f.wine} | ${f.retailer} | ${f.price || 'N/A'} |\n`;
    }
    
    if (soldOut.length > 10) {
      report += `| ... and ${soldOut.length - 10} more | | |\n`;
    }
    report += `\n`;
  }
  
  if (inStock.length === 0 && soldOut.length === 0) {
    report += `📭 No target wines found on monitored sites.\n\n`;
  }
  
  report += `## Summary\n\n`;
  report += `- **Sites Checked:** Tier 1 retailers + ${process.argv.includes('--full') ? 'Tier 2' : 'Tier 1 only'}\n`;
  report += `- **Target Wines:** ${allTargetWines.length}\n`;
  report += `- **In Stock:** ${inStock.length}\n`;
  report += `- **Sold Out:** ${soldOut.length}\n`;
  report += `- **Run Time:** ${timestamp}\n\n`;
  
  report += `---\n\n`;
  report += `*Next run: Tomorrow 5:00 AM ET*\n`;
  report += `*Use --full flag to check tier 2 retailers*\n`;
  
  return { report, inStock, soldOut };
}

async function main() {
  log('START', '=== Wine Web Scout Started ===');
  
  const isFullRun = process.argv.includes('--full');
  log('CONFIG', `Mode: ${isFullRun ? 'FULL (Tier 1 + Tier 2)' : 'TIER 1 only'}`);
  
  const retailers = [
    ...RETAILER_URLS.tier1,
    ...(isFullRun ? RETAILER_URLS.tier2 : [])
  ];
  
  const allFindings = [];
  
  for (const retailer of retailers) {
    const findings = await checkRetailer(retailer, allTargetWines);
    allFindings.push(...findings);
    
    // Rate limiting
    if (retailers.indexOf(retailer) < retailers.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  const { report, inStock } = generateReport(allFindings);
  
  // Save report
  const reportFile = join(MEMORY_DIR, `web-scout-${new Date().toISOString().split('T')[0]}.md`);
  writeFileSync(reportFile, report);
  
  // Also save latest
  writeFileSync(join(MEMORY_DIR, 'web-scout-latest.md'), report);
  
  // Print report
  console.log('\n' + '='.repeat(70));
  console.log(report);
  console.log('='.repeat(70) + '\n');
  
  log('END', `=== Scout Complete - ${inStock.length} wines in stock ===`);
  
  // Exit code 0 if anything in stock
  process.exit(inStock.length > 0 ? 0 : 1);
}

main().catch(err => {
  log('FATAL', err.message);
  console.error(err);
  process.exit(1);
});
