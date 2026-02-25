#!/usr/bin/env node
/**
 * Multi-Wine Hunt System - Prashant's Dynamic Wine Tracker
 * Reads from /data/workspace/config/wine-watchlist.json
 * Uses Tavily search - no Brave API key needed
 * Daily automated hunting with duplicate detection
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = '/data/workspace';
const TAVILY_SCRIPT = join(ROOT_DIR, 'skills/tavily-search/scripts/search.mjs');
const CONFIG_FILE = join(ROOT_DIR, 'config/wine-watchlist.json');
const LOG_DIR = join(ROOT_DIR, 'logs');
const SEEN_DIR = join(ROOT_DIR, 'memory/wine-hunts');

// Ensure directories
mkdirSync(LOG_DIR, { recursive: true });
mkdirSync(SEEN_DIR, { recursive: true });

function getTimestamp() {
  return new Date().toISOString();
}

function getESTTime() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
}

function log(category, message) {
  const line = `[${getTimestamp()}] [${category}] ${message}`;
  console.log(line);
  
  const today = new Date().toISOString().split('T')[0];
  const logFile = join(LOG_DIR, `wine-hunt-${today}.log`);
  writeFileSync(logFile, line + '\n', { flag: 'a' });
}

function loadConfig() {
  try {
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    log('ERROR', `Failed to load config: ${e.message}`);
    return null;
  }
}

function loadSeenListings(wineId) {
  const seenFile = join(SEEN_DIR, `${wineId}-seen.md`);
  try {
    if (existsSync(seenFile)) {
      return readFileSync(seenFile, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(s => s.trim().toLowerCase());
    }
  } catch (e) {}
  return [];
}

function saveSeenListing(wineId, listing) {
  const seenFile = join(SEEN_DIR, `${wineId}-seen.md`);
  try {
    writeFileSync(seenFile, listing + '\n', { flag: 'a' });
  } catch (e) {
    log('ERROR', `Failed to save seen: ${e.message}`);
  }
}

function runTavilySearch(query, maxResults = 5) {
  try {
    log('SEARCH', `Query: ${query.substring(0, 80)}...`);
    const result = execSync(
      `node "${TAVILY_SCRIPT}" "${query.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return result;
  } catch (error) {
    log('ERROR', `Search failed: ${error.message}`);
    return `ERROR: ${error.message}`;
  }
}

function parseFindings(result, wine, seenList) {
  const findings = [];
  const lines = result.split('\n');
  
  const stockPatterns = [
    /in stock/i,
    /available/i,
    /\$\d{2,3}/,
    /buy now/i,
    /add to cart/i,
    /\d{4}.*vintage/i
  ];
  
  for (const line of lines) {
    if (line.length < 10) continue;
    
    const hasWine = line.toLowerCase().includes(wine.name.toLowerCase().split(' ')[0]) ||
                    line.toLowerCase().includes(wine.name.toLowerCase().split(' ').slice(-1)[0]);
    
    if (hasWine) {
      const hasStock = stockPatterns.some(p => p.test(line));
      if (hasStock) {
        const isNew = !seenList.some(s => line.toLowerCase().includes(s.substring(0, 30)));
        if (isNew) {
          findings.push({
            line: line.trim(),
            isNew: true,
            wineId: wine.id
          });
        }
      }
    }
  }
  
  return findings;
}

function generateSummaryReport(allResults) {
  const newFindings = allResults.filter(r => r.newFindings.length > 0);
  
  let report = `\n${'='.repeat(60)}\n`;
  report += `WINE HUNT SUMMARY - ${getESTTime()} ET\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  if (newFindings.length === 0) {
    report += `📭 No new stock found today.\n\n`;
  } else {
    report += `🍷 ${newFindings.length} WINE(S) WITH NEW FINDINGS:\n\n`;
    
    for (const result of newFindings) {
      report += `• ${result.wine.name}\n`;
      report += `  Priority: ${result.wine.priority.toUpperCase()}\n`;
      
      for (const finding of result.newFindings.slice(0, 3)) {
        report += `  → ${finding.line.substring(0, 100)}...\n`;
      }
      report += '\n';
    }
  }
  
  report += `HUNTED: ${allResults.length} wines\n`;
  report += `NEXT RUN: Tomorrow 5:00 AM ET\n`;
  report += `CONFIG: ${CONFIG_FILE}\n`;
  report += `${'='.repeat(60)}\n`;
  
  return report;
}

// MAIN
log('START', `=== Daily Wine Hunt Started ===`);
log('START', `Time (ET): ${getESTTime()}`);

const config = loadConfig();
if (!config) {
  log('FATAL', 'Cannot proceed without config');
  process.exit(1);
}

log('CONFIG', `Loaded ${config.wines.length} wines from watchlist`);
log('CONFIG', `Last updated: ${config.lastUpdated}`);

const allResults = [];

// Hunt each wine
for (const wine of config.wines) {
  if (wine.status !== 'hunting') {
    log('SKIP', `${wine.name} - status: ${wine.status}`);
    continue;
  }
  
  log('HUNT', `Searching: ${wine.name}`);
  
  // Build search queries
  const queries = [
    `${wine.name} available near ${config.settings.zipCode} wine shop`,
    `${wine.name} in stock 2023 2022 ${wine.vintages.slice(0, 2).join(' ')}`,
  ];
  
  if (wine.sources.includes('kermit-lynch') || wine.sources.includes('any')) {
    queries.push(`${wine.name} Kermit Lynch`);
  }
  
  const seenList = loadSeenListings(wine.id);
  const newFindings = [];
  
  for (const query of queries) {
    const result = runTavilySearch(query);
    const findings = parseFindings(result, wine, seenList);
    
    for (const finding of findings) {
      if (finding.isNew) {
        newFindings.push(finding);
        saveSeenListing(wine.id, finding.line);
        log('FIND', `🍷 ${wine.name}: ${finding.line.substring(0, 80)}...`);
      }
    }
  }
  
  allResults.push({
    wine,
    newFindings,
    totalQueries: queries.length
  });
  
  // Rate limiting - small delay between wines
  if (config.wines.indexOf(wine) < config.wines.length - 1) {
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Generate and output summary
const summary = generateSummaryReport(allResults);
log('SUMMARY', summary);

// Output to stdout for cron capture
console.log('\n\n' + summary);

log('END', `=== Hunt Complete ===`);
process.exit(0);
