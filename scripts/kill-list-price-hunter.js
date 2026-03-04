#!/usr/bin/env node
/**
 * Daily Kill List Price Hunter
 * Runs Tavily searches for each target wine, alerts on deals below target price
 */

const { execSync } = require('child_process');
const { writeFileSync, existsSync, readFileSync } = require('fs');

const MEMORY_FILE = '/data/workspace/memory/wine-deal-alerts.md';
const PRICE_HISTORY_FILE = '/data/workspace/memory/wine-price-history.json';

// === THE KILL LIST ===
const KILL_LIST = [
  { producer: 'Clape', wine: 'Cornas', vintages: ['2019', '2015'], targetPrice: 250, maxPrice: 275 },
  { producer: 'Jamet', wine: 'Côte-Rôtie', vintages: ['2019', '2022'], targetPrice: 285, maxPrice: 325 },
  { producer: 'Montrose', wine: 'Saint-Estèphe', vintages: ['2016', '2010'], targetPrice: 250, maxPrice: 280 },
  { producer: 'Tempier', wine: 'Cabassaou', vintages: ['2019', '2020'], targetPrice: 160, maxPrice: 180 },
  { producer: 'Clos Mogador', wine: 'Priorat', vintages: ['2019'], targetPrice: 120, maxPrice: 130 },
  { producer: 'Paolo Bea', wine: 'Pagliaro', vintages: ['2015', '2017'], targetPrice: 145, maxPrice: 160 },
  { producer: 'Sorrel', wine: 'Le Gréal', vintages: ['2019'], targetPrice: 210, maxPrice: 240 },
  { producer: 'Dugat-Py', wine: 'Cœur de Roy', vintages: ['2019', '2020'], targetPrice: 195, maxPrice: 220 },
  { producer: 'Cappellano', wine: 'Pie Rupestris', vintages: ['2016', '2019'], targetPrice: 300, maxPrice: 350 },
  { producer: 'Allemand', wine: 'Chaillot', vintages: ['2018', '2019'], targetPrice: 375, maxPrice: 400 },
  { producer: 'Voge', wine: 'Les Vieilles Vignes', vintages: ['2019', '2020'], targetPrice: 225, maxPrice: 250 },
];

function loadPriceHistory() {
  try {
    if (existsSync(PRICE_HISTORY_FILE)) {
      return JSON.parse(readFileSync(PRICE_HISTORY_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function savePriceHistory(history) {
  writeFileSync(PRICE_HISTORY_FILE, JSON.stringify(history, null, 2));
}

function extractPrice(text) {
  // Look for price patterns: $XXX, $XXX.XX, €XXX, etc.
  const priceMatches = text.match(/[$€£](\d{2,4})(?:\.\d{2})?/g);
  if (priceMatches) {
    // Return the lowest price found
    const prices = priceMatches.map(p => parseFloat(p.replace(/[$€£]/g, '')));
    return Math.min(...prices);
  }
  return null;
}

function searchWine(target) {
  const query = `${target.producer} ${target.wine} ${target.vintages.join(' ')} price buy`;
  
  try {
    const result = execSync(
      `node /data/workspace/skills/tavily-search/scripts/search.mjs "${query}" -n 5`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return result;
  } catch (e) {
    return null;
  }
}

function parseSearchResults(resultText, target) {
  const deals = [];
  const lines = resultText.split('\n');
  let currentUrl = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Capture URL lines (they start with http)
    if (line.trim().startsWith('http')) {
      currentUrl = line.trim();
      continue;
    }
    
    const price = extractPrice(line);
    if (price && price <= target.maxPrice) {
      const isGreatDeal = price <= target.targetPrice;
      deals.push({
        wine: `${target.producer} ${target.wine}`,
        price: price,
        targetPrice: target.targetPrice,
        isGreatDeal: isGreatDeal,
        source: line.substring(0, 100),
        url: currentUrl
      });
    }
  }
  
  return deals;
}

async function main() {
  console.log('🔍 DAILY KILL LIST PRICE HUNT');
  console.log('Searching for rock-bottom prices...\n');
  
  const priceHistory = loadPriceHistory();
  const allDeals = [];
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  for (const target of KILL_LIST) {
    console.log(`Searching: ${target.producer} ${target.wine}...`);
    
    const result = searchWine(target);
    if (!result) {
      console.log(`  ❌ Search failed`);
      continue;
    }
    
    const deals = parseSearchResults(result, target);
    if (deals.length > 0) {
      const bestDeal = deals.sort((a, b) => a.price - b.price)[0];
      allDeals.push(bestDeal);
      
      const key = `${target.producer}_${target.wine}`;
      const previousBest = priceHistory[key]?.price || Infinity;
      
      if (bestDeal.price < previousBest) {
        console.log(`  🎯 NEW LOW: $${bestDeal.price} (was $${previousBest})`);
        priceHistory[key] = { price: bestDeal.price, date: timestamp };
      } else {
        console.log(`  ✓ Found: $${bestDeal.price}`);
      }
    } else {
      console.log(`  📭 No deals under $${target.maxPrice}`);
    }
    
    // Rate limiting - be nice to Tavily
    await new Promise(r => setTimeout(r, 1000));
  }
  
  savePriceHistory(priceHistory);
  
  if (allDeals.length > 0) {
    const greatDeals = allDeals.filter(d => d.isGreatDeal);
    
    let alert = `🎯 KILL LIST PRICE ALERT - ${timestamp} ET\n`;
    alert += `${'='.repeat(50)}\n\n`;
    
    if (greatDeals.length > 0) {
      alert += `🔥 ROCK-BOTTOM DEALS (Below Target Price):\n\n`;
      for (const deal of greatDeals) {
        alert += `🎯 ${deal.wine}\n`;
        alert += `   Price: $${deal.price} (Target: $${deal.targetPrice})\n`;
        alert += `   Savings: $${deal.targetPrice - deal.price}\n`;
        if (deal.url) {
          alert += `   Link: ${deal.url}\n`;
        }
        alert += `\n`;
      }
    }
    
    const goodDeals = allDeals.filter(d => !d.isGreatDeal);
    if (goodDeals.length > 0) {
      alert += `💰 GOOD DEALS (Under Max Price):\n\n`;
      for (const deal of goodDeals) {
        alert += `${deal.wine}\n`;
        alert += `   Price: $${deal.price} (Target: $${deal.targetPrice}, Max: $${deal.targetPrice + 25})\n`;
        if (deal.url) {
          alert += `   Link: ${deal.url}\n`;
        }
        alert += `\n`;
      }
    }
    
    alert += `---\n`;
    alert += `Action: Check sources and PULL THE TRIGGER on 🔥 deals!\n`;
    
    writeFileSync(MEMORY_FILE, alert);
    console.log('\n' + '='.repeat(50));
    console.log(alert);
    process.exit(0);
  } else {
    console.log('\n📭 No deals found today. Allemand keeps hunting...');
    process.exit(1);
  }
}

main();
