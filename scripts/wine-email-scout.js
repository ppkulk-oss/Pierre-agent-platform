#!/usr/bin/env node
/**
 * Wine Email Scout - Enhanced Allocation Warfare Edition
 * Monitors Fastmail inbox for wine allocation alerts
 * Enhanced with priority scoring, multiple retailers, and better detection
 * 
 * Run: node scripts/wine-email-scout.js
 * Heartbeat: Run every 4 hours during allocation season (Sept-March)
 */

const { readEmails } = require('/data/workspace/skills/fastmail-reader/index.js');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Configuration
const MEMORY_DIR = '/data/workspace/memory';
const LOG_DIR = '/data/workspace/logs';
const LAST_CHECK_FILE = join(MEMORY_DIR, 'fastmail-last-check.txt');
const ALERT_FILE = join(MEMORY_DIR, `wine-alerts-${new Date().toISOString().split('T')[0]}.md`);
const PRICE_DB = join(MEMORY_DIR, 'wine-prices.json');

// Ensure directories
mkdirSync(LOG_DIR, { recursive: true });

// Enhanced keyword detection with scoring
const KEYWORD_PATTERNS = {
  // Producer names (highest priority)
  producers: {
    'allemand': { score: 100, priority: 'HIGH', wines: ['allemand-reynard', 'allemand-chaillot'] },
    'thierry allemand': { score: 100, priority: 'HIGH', wines: ['allemand-reynard', 'allemand-chaillot'] },
    'clape': { score: 90, priority: 'HIGH', wines: ['clape-cornas'] },
    'auguste clape': { score: 90, priority: 'HIGH', wines: ['clape-cornas'] },
    'gonon': { score: 90, priority: 'HIGH', wines: ['gonon-saint-joseph', 'gonon-blanc'] },
    'pierre gonon': { score: 90, priority: 'HIGH', wines: ['gonon-saint-joseph', 'gonon-blanc'] },
    'chave': { score: 70, priority: 'MEDIUM', wines: ['chave-hermitage'] },
    'jean-louis chave': { score: 70, priority: 'MEDIUM', wines: ['chave-hermitage'] },
    'rostaing': { score: 60, priority: 'MEDIUM', wines: ['rostaing-cote'] },
    'rene rostaing': { score: 60, priority: 'MEDIUM', wines: ['rostaing-cote'] },
    'ogier': { score: 50, priority: 'MEDIUM', wines: ['ogier-hermitage'] },
    'stephane ogier': { score: 50, priority: 'MEDIUM', wines: ['ogier-hermitage'] },
  },
  // Vineyard/region names
  vineyards: {
    'reynard': { score: 100, priority: 'HIGH', note: 'Unicorn wine!' },
    'chaillot': { score: 95, priority: 'HIGH' },
    'cornas': { score: 60, priority: 'MEDIUM' },
    'saint-joseph': { score: 50, priority: 'MEDIUM' },
    'hermitage': { score: 50, priority: 'MEDIUM' },
    'cote-rotie': { score: 40, priority: 'MEDIUM' },
  },
  // Action keywords (indicate availability)
  actions: {
    'allocation': { score: 80, multiplier: 1.5 },
    'available': { score: 60, multiplier: 1.3 },
    'in stock': { score: 60, multiplier: 1.3 },
    'just landed': { score: 70, multiplier: 1.4 },
    'new release': { score: 65, multiplier: 1.3 },
    'pre-arrival': { score: 55, multiplier: 1.2 },
    'arrival': { score: 55, multiplier: 1.2 },
    'now available': { score: 75, multiplier: 1.4 },
    'back in stock': { score: 70, multiplier: 1.4 },
    'limited release': { score: 65, multiplier: 1.3 },
  },
  // Vintage years to watch
  vintages: {
    '2024': { score: 40 },
    '2023': { score: 35 },
    '2022': { score: 30 },
    '2021': { score: 25 },
    '2020': { score: 20 },
  }
};

// Tier 1 retailers (highest trust, most likely to have allocations)
const RETAILERS_TIER1 = [
  { name: 'Kermit Lynch', patterns: ['kermitlynch', 'kermit lynch'] },
  { name: 'Crush Wine', patterns: ['crushwine', 'crush wine'] },
  { name: 'Rare Wine Co', patterns: ['rarewineco', 'rare wine'] },
  { name: 'SommPicks', patterns: ['sommpicks', 'somm picks'] },
];

// Tier 2 retailers (good sources, check less frequently)
const RETAILERS_TIER2 = [
  { name: 'K&L Wine', patterns: ['klwines', 'k&l wine'] },
  { name: 'Saratoga Wine', patterns: ['saratogawine'] },
  { name: 'Flatiron Wines', patterns: ['flatiron'] },
  { name: 'Chambers Street', patterns: ['chambersst'] },
  { name: 'JJ Buckley', patterns: ['jjbuckley'] },
  { name: 'Wine-Searcher', patterns: ['wine-searcher'] },
];

// Ignore list (promotional noise)
const IGNORE_PATTERNS = [
  /unsubscribe/i,
  /promotional/i,
  /newsletter preview/i,
  /coming soon/i,  // Often just teasing, not actual stock
  /sneak peek/i,
];

function getLastCheckTime() {
  try {
    if (existsSync(LAST_CHECK_FILE)) {
      return parseInt(readFileSync(LAST_CHECK_FILE, 'utf-8'));
    }
  } catch (e) {}
  return Date.now() - (24 * 60 * 60 * 1000); // Default: 24 hours ago
}

function saveLastCheckTime() {
  writeFileSync(LAST_CHECK_FILE, Date.now().toString());
}

function isNewEmail(emailDate, lastCheck) {
  if (!emailDate) return true;
  const emailTime = new Date(emailDate).getTime();
  return emailTime > lastCheck;
}

function shouldIgnore(email) {
  const text = `${email.subject} ${email.body || ''}`.toLowerCase();
  return IGNORE_PATTERNS.some(pattern => pattern.test(text));
}

function detectRetailer(from) {
  const fromLower = from.toLowerCase();
  
  for (const retailer of RETAILERS_TIER1) {
    if (retailer.patterns.some(p => fromLower.includes(p))) {
      return { name: retailer.name, tier: 1 };
    }
  }
  
  for (const retailer of RETAILERS_TIER2) {
    if (retailer.patterns.some(p => fromLower.includes(p))) {
      return { name: retailer.name, tier: 2 };
    }
  }
  
  return { name: from, tier: 3 };
}

function scanEmail(email) {
  const text = `${email.subject} ${email.from} ${email.body || ''}`.toLowerCase();
  let totalScore = 0;
  let maxPriority = 'LOW';
  const matchedKeywords = [];
  const matchedWines = new Set();
  
  // Check each category
  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    for (const [keyword, data] of Object.entries(patterns)) {
      if (text.includes(keyword.toLowerCase())) {
        let score = data.score || 10;
        
        // Apply action multipliers
        if (data.multiplier) {
          score = Math.round(score * data.multiplier);
        }
        
        totalScore += score;
        matchedKeywords.push({ keyword, category, score, note: data.note });
        
        if (data.priority && priorityValue(data.priority) > priorityValue(maxPriority)) {
          maxPriority = data.priority;
        }
        
        if (data.wines) {
          data.wines.forEach(w => matchedWines.add(w));
        }
      }
    }
  }
  
  const retailer = detectRetailer(email.from);
  
  // Boost score for tier 1 retailers
  if (retailer.tier === 1) {
    totalScore = Math.round(totalScore * 1.3);
  }
  
  // Determine if this is actionable
  const isActionable = totalScore >= 50 && matchedKeywords.some(k => k.category === 'actions');
  const isHighValue = totalScore >= 100;
  
  return {
    score: totalScore,
    priority: isHighValue ? 'HIGH' : maxPriority,
    matchedKeywords: matchedKeywords.sort((a, b) => b.score - a.score),
    matchedWines: Array.from(matchedWines),
    retailer,
    isActionable,
    isHighValue
  };
}

function priorityValue(p) {
  const values = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return values[p] || 0;
}

function formatAlert(emails) {
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let output = `# 🍷 Wine Alert - ${timestamp} ET\n\n`;
  
  // Sort by priority and score
  emails.sort((a, b) => {
    if (a.scan.priority !== b.scan.priority) {
      return priorityValue(b.scan.priority) - priorityValue(a.scan.priority);
    }
    return b.scan.score - a.scan.score;
  });
  
  for (const email of emails) {
    const scan = email.scan;
    const priorityEmoji = scan.priority === 'HIGH' ? '🔴' : scan.priority === 'MEDIUM' ? '🟡' : '🟢';
    
    output += `## ${priorityEmoji} ${scan.priority} PRIORITY (Score: ${scan.score})\n\n`;
    output += `- **From:** ${email.from} (${scan.retailer.name})\n`;
    output += `- **Subject:** ${email.subject}\n`;
    output += `- **Date:** ${email.date}\n`;
    output += `- **Matched Wines:** ${scan.matchedWines.join(', ') || 'General match'}\n\n`;
    
    output += `**Keywords Detected:**\n`;
    for (const kw of scan.matchedKeywords.slice(0, 8)) {
      output += `- ${kw.keyword} (${kw.category}, +${kw.score})`;
      if (kw.note) output += ` - *${kw.note}*`;
      output += `\n`;
    }
    if (scan.matchedKeywords.length > 8) {
      output += `- ... and ${scan.matchedKeywords.length - 8} more\n`;
    }
    
    output += `\n**Action Required:** ${scan.isHighValue ? 'IMMEDIATE - Check email NOW!' : 'Check when convenient'}\n\n`;
    output += `---\n\n`;
  }
  
  output += `## Quick Links\n\n`;
  output += `- [Fastmail Inbox](https://www.fastmail.com)\n`;
  output += `- [Kermit Lynch](https://www.kermitlynch.com)\n`;
  output += `- [Crush Wine](https://www.crushwineco.com)\n`;
  output += `- [Rare Wine Co](https://www.rarewineco.com)\n\n`;
  
  return output;
}

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  
  const logFile = join(LOG_DIR, `wine-scout-${new Date().toISOString().split('T')[0]}.log`);
  writeFileSync(logFile, line + '\n', { flag: 'a' });
}

async function main() {
  log('🔍 Starting Wine Email Scout...');
  
  const lastCheck = getLastCheckTime();
  log(`Last check: ${new Date(lastCheck).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
  
  saveLastCheckTime();
  
  try {
    const emails = await readEmails();
    log(`Fetched ${emails.length} emails`);
    
    const wineEmails = [];
    
    for (const email of emails) {
      // Skip old emails
      if (!isNewEmail(email.date, lastCheck)) {
        continue;
      }
      
      // Skip ignored patterns
      if (shouldIgnore(email)) {
        continue;
      }
      
      const scan = scanEmail(email);
      
      // Only flag actionable emails with sufficient score
      if (scan.score >= 30) {
        wineEmails.push({ ...email, scan });
        log(`🍷 MATCH: "${email.subject}" from ${scan.retailer.name} (Score: ${scan.score}, ${scan.priority})`);
      }
    }
    
    if (wineEmails.length > 0) {
      const alert = formatAlert(wineEmails);
      
      // Write to today's alert file
      writeFileSync(ALERT_FILE, alert);
      
      // Also append to cumulative alerts
      const allAlertsFile = join(MEMORY_DIR, 'wine-alerts-latest.md');
      writeFileSync(allAlertsFile, alert);
      
      log(`✅ Alert generated: ${wineEmails.length} wine-related emails found`);
      log(`📝 Saved to: ${ALERT_FILE}`);
      
      // Print summary to stdout
      console.log('\n' + '='.repeat(60));
      console.log(alert);
      console.log('='.repeat(60) + '\n');
      
      // Exit code 0 = found alerts
      process.exit(0);
    } else {
      log('📭 No wine allocation emails found.');
      process.exit(1);
    }
    
  } catch (err) {
    log(`❌ Error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
