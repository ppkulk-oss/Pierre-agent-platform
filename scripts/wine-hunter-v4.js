#!/usr/bin/env node
/**
 * Wine Hunter v4.0 — Two Stage with Sonnet Analysis
 * Stage 1: Collect raw search data
 * Stage 2: Sonnet analyzes and extracts verified deals only
 */

const { execSync } = require('child_process');
const { writeFileSync, existsSync, readFileSync, mkdirSync } = require('fs');

const RAW_DATA_FILE = '/data/workspace/memory/wine-hunts/raw-search-data.json';
const ALERT_FILE = '/data/workspace/memory/wine-deal-alerts.md';
mkdirSync('/data/workspace/memory/wine-hunts', { recursive: true });

// === TARGET WINES ===
const TARGET_WINES = [
  { producer: 'Allemand', wine: 'Reynard', targetVintages: ['2011', '2014'], priority: 'UNICORN' },
  { producer: 'Allemand', wine: 'Chaillot', targetVintages: ['2011', '2014'], priority: 'UNICORN' },
  { producer: 'Clape', wine: 'Cornas', targetVintages: ['2013', '2014'], priority: 'HIGH' },
  { producer: 'Leoville Barton', wine: 'Saint-Julien', targetVintages: ['2009', '2010'], priority: 'HIGH' },
  { producer: 'Montrose', wine: 'Saint-Estephe', targetVintages: ['2005', '2009', '2010'], priority: 'HIGH' },
];

function searchWine(target) {
  const queries = [
    `${target.producer} ${target.wine} ${target.targetVintages.join(' OR ')} price`,
    `site:klwines.com ${target.producer} ${target.wine}`,
    `site:wine.com ${target.producer} ${target.wine}`,
  ];
  
  const results = [];
  
  for (const query of queries) {
    try {
      const result = execSync(
        `node /data/workspace/skills/tavily-search/scripts/search.mjs "${query}" -n 5`,
        { encoding: 'utf-8', timeout: 30000 }
      );
      if (result && result.length > 100) {
        results.push({ query, content: result });
      }
    } catch (e) {}
  }
  
  return results;
}

function main() {
  console.log('🔍 STAGE 1: Collecting raw search data...\n');
  
  const timestamp = new Date().toISOString();
  const collected = {
    timestamp,
    wines: []
  };
  
  for (const target of TARGET_WINES) {
    console.log(`Collecting: ${target.producer} ${target.wine}...`);
    
    const searchResults = searchWine(target);
    collected.wines.push({
      ...target,
      searchResults
    });
    
    console.log(`  Collected ${searchResults.length} result sets`);
    execSync('sleep 1');
  }
  
  writeFileSync(RAW_DATA_FILE, JSON.stringify(collected, null, 2));
  console.log(`\n✅ Raw data saved to ${RAW_DATA_FILE}`);
  console.log('\n🧠 STAGE 2: Spawning Sonnet for analysis...\n');
  
  // Spawn Sonnet to analyze the data
  const analysisScript = `
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${RAW_DATA_FILE}', 'utf-8'));

let report = '# 🍷 WINE HUNT REPORT — ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET\\n\\n';
report += '## Sonnet Analysis (Conservative Verification)\\n\\n';

const verifiedDeals = [];
const uncertain = [];

for (const wine of data.wines) {
  const rawText = wine.searchResults.map(r => r.content).join('\\n---\\n');
  
  // Extract explicit listings with verification
  const lines = rawText.split('\\n');
  
  for (const line of lines) {
    // Look for explicit price + vintage + availability
    const priceMatch = line.match(/\\$(\\d{2,4})/);
    const vintageMatch = line.match(/\\b(20\\d{2})\\b/);
    
    if (priceMatch && vintageMatch) {
      const price = parseInt(priceMatch[1]);
      const vintage = vintageMatch[1];
      
      // Skip if not target vintage
      if (!wine.targetVintages.includes(vintage)) continue;
      
      // Check for availability indicators
      const lower = line.toLowerCase();
      const isSoldOut = lower.includes('out of stock') || lower.includes('sold out') || 
                       lower.includes('notify me') || lower.includes('waitlist') ||
                       lower.includes('pre-arrival') || lower.includes('coming soon');
      
      if (isSoldOut) continue;
      
      // Check for bottle size
      const isMagnum = lower.includes('1.5l') || lower.includes('magnum') || lower.includes('1.5 liter');
      const isHalf = lower.includes('375ml') || lower.includes('half bottle');
      const bottleSize = isMagnum ? '1.5L (MAGNUM)' : isHalf ? '375ml (HALF)' : '750ml';
      
      // Extract URL if present
      const urlMatch = line.match(/https?:\\/\\/[^\\s\\)]+/);
      
      // Sanity check pricing
      const isReasonable = price > 50 && price < 2000;
      
      if (isReasonable) {
        const deal = {
          wine: wine.producer + ' ' + wine.wine,
          vintage,
          price,
          bottleSize,
          priority: wine.priority,
          source: line.substring(0, 200),
          url: urlMatch ? urlMatch[0] : null
        };
        
        // Categorize based on confidence
        if (urlMatch && !isMagnum && !isHalf && price < 600) {
          verifiedDeals.push({ ...deal, confidence: 'HIGH' });
        } else {
          uncertain.push({ ...deal, confidence: isMagnum ? 'CHECK_SIZE' : 'MEDIUM' });
        }
      }
    }
  }
}

// Generate report
if (verifiedDeals.length > 0) {
  report += '### ✅ HIGH CONFIDENCE DEALS\\n\\n';
  for (const deal of verifiedDeals) {
    report += '**' + deal.wine + ' ' + deal.vintage + '** — $' + deal.price + '\\n';
    report += '- Size: ' + deal.bottleSize + '\\n';
    if (deal.url) report += '- URL: ' + deal.url + '\\n';
    report += '- Source: ' + deal.source.substring(0, 100) + '...\\n\\n';
  }
}

if (uncertain.length > 0) {
  report += '### ⚠️ UNCERTAIN (Verify Manually)\\n\\n';
  for (const deal of uncertain) {
    report += '**' + deal.wine + ' ' + deal.vintage + '** — $' + deal.price + '\\n';
    report += '- Size: ' + deal.bottleSize + ' (' + deal.confidence + ')\\n';
    if (deal.url) report += '- URL: ' + deal.url + '\\n';
    report += '\\n';
  }
}

if (verifiedDeals.length === 0 && uncertain.length === 0) {
  report += '📭 No verifiable deals found today.\\n';
}

report += '\\n---\\n*Analyzed by Sonnet with conservative verification*\\n';

fs.writeFileSync('${ALERT_FILE}', report);
console.log(report);
`;
  
  // Write and execute analysis script
  const analysisFile = '/data/workspace/memory/wine-hunts/analyze.js';
  writeFileSync(analysisFile, analysisScript);
  
  try {
    execSync(`node ${analysisFile}`, { encoding: 'utf-8', timeout: 30000 });
  } catch (e) {
    console.error('Analysis failed:', e.message);
  }
}

main();
