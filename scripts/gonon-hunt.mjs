#!/usr/bin/env node
/**
 * Pierre Gonon Wine Hunt Script
 * Searches for Pierre Gonon Saint Joseph availability near Holmdel, NJ
 * Uses Tavily search - no Brave API key needed
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const TAVILY_SCRIPT = '/data/workspace/skills/tavily-search/scripts/search.mjs';
const LOG_FILE = '/data/workspace/logs/gonon-hunt.log';
const MEMORY_FILE = '/data/workspace/memory/gonon-seen.md';

// Ensure log directory exists
import { mkdirSync } from 'fs';
try { mkdirSync('/data/workspace/logs', { recursive: true }); } catch (e) {}

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    writeFileSync(LOG_FILE, line, { flag: 'a' });
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function runTavilySearch(query) {
  try {
    const result = execSync(
      `node "${TAVILY_SCRIPT}" "${query}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return result;
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

function getSeenListings() {
  try {
    if (existsSync(MEMORY_FILE)) {
      return readFileSync(MEMORY_FILE, 'utf-8').split('\n').filter(Boolean);
    }
  } catch (e) {}
  return [];
}

function saveSeen(listing) {
  try {
    writeFileSync(MEMORY_FILE, listing + '\n', { flag: 'a' });
  } catch (e) {}
}

// Main hunt
log('=== Starting Pierre Gonon Wine Hunt ===');
log('Searching: Saint Joseph Rouge near Holmdel, NJ 07733');

// Search 1: General availability
const result1 = runTavilySearch('Pierre Gonon Saint Joseph Rouge available near Holmdel NJ 07733');
log('Search Result (Local):');
log(result1);

// Search 2: Online stockists
const result2 = runTavilySearch('Pierre Gonon Saint Joseph Kermit Lynch Crush Wine Rare Wine Co stock 2023 2022');
log('\nSearch Result (Online Retailers):');
log(result2);

// Check for key availability patterns
const inStockPatterns = [
  /in stock/i,
  /available now/i,
  /\$\d+/,
  /\$1[0-4]\d/, // $100-149 range
  /202[23]/, // 2022 or 2023 vintage
];

let foundNew = false;
const seenBefore = getSeenListings();

// Parse for new findings
const lines = (result1 + result2).split('\n');
for (const line of lines) {
  if (line.includes('Pierre Gonon') || line.includes('Gonon')) {
    const isStock = inStockPatterns.some(p => p.test(line));
    if (isStock) {
      const isNew = !seenBefore.some(s => line.includes(s));
      if (isNew && line.trim()) {
        log(`\n🍷 NEW FINDING: ${line.trim()}`);
        saveSeen(line.trim());
        foundNew = true;
      }
    }
  }
}

if (!foundNew) {
  log('\nNo new stock found in this run.');
}

// Summary
log('\n=== Hunt Complete ===');
log(`Checked at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
log('Next Steps:');
log('- Kermit Lynch: Usually stocked (online/shipped)');
log('- Local NJ shops: Still limited/unavailable near 07733');
log('- Rare Wine Co: Check periodically for older vintages');
log('\n');

// Return status
if (foundNew) {
  process.exit(0); // Success with findings
} else {
  process.exit(1); // No new findings but script worked
}
