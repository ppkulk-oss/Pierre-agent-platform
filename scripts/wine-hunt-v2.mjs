#!/usr/bin/env node
/**
 * Multi-Wine Hunt System v2.0 - PARALLEL OPTIMIZED
 * Prashant's Dynamic Wine Tracker
 * Reads from /data/workspace/config/wine-watchlist.json
 * Uses Tavily search - no Brave API key needed
 * Daily automated hunting with duplicate detection
 * PARALLEL SEARCHES for maximum speed
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
const REPORT_FILE = join(ROOT_DIR, 'memory/wine-hunt-latest.md');

// Configuration
const MAX_PARALLEL = 5; // Run 5 wines at once
const DELAY_BETWEEN_BATCHES = 1000; // 1 second batch gap

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

function runTavilySearch(query) {
  try {
    const result = execSync(
      `node "${TAVILY_SCRIPT}" "${query.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', timeout: 25000 }
    );
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function buildQueries(wine, zipCode) {
  const queries = [];
  
  // Local search
  queries.push(`${wine.name} available near ${zipCode} wine shop in stock`);
  
  // Online retailers
  queries.push(`${wine.name} buy online ${wine.vintages.slice(0, 2).join(' ')} price`);
  
  // Specific sources
  if (wine.sources.includes('kermit-lynch') || wine.sources.includes('any')) {
    queries.push(`${wine.name} Kermit Lynch price in stock`);
  }
  if (wine.sources.includes('crush-wine') || wine.sources.includes('any')) {
    queries.push(`${wine.name} Crush Wine`);
  }
  if (wine.sources.includes('rare-wine-co') || wine.sources.includes('any')) {
    queries.push(`${wine.name} Rare Wine Co`);
  }
  
  return queries.slice(0, 4); // Max 4 queries per wine
}

async function huntSingleWine(wine, config) {
  log('HUNT', `Searching: ${wine.name}`);
  
  const queries = buildQueries(wine, config.settings.zipCode);
  const seenList = loadSeenListings(wine.id);
  const newFindings = [];
  
  // Run all queries for this wine
  for (const query of queries) {
    const { success, result, error } = runTavilySearch(query);
    
    if (!success) {
      log('WARN', `Query failed for ${wine.name}: ${error}`);
      continue;
    }
    
    // Parse findings
    const lines = result.split('\n');
    const stockPatterns = [/in stock/i, /available/i, /\$\d{2,3}/, /20(?:1[5-9]|2[0-5]).*vintage/i];
    
    for (const line of lines) {
      if (line.length < 15) continue;
      
      const lineLower = line.toLowerCase();
      const hasWine = lineLower.includes(wine.name.toLowerCase().split(' ')[0]) ||
                      lineLower.includes(wine.name.toLowerCase().split(' ').slice(-1)[0]);
      
      if (hasWine && stockPatterns.some(p => p.test(line))) {
        const lineKey = lineLower.substring(0, 40);
        const isNew = !seenList.some(s => s.includes(lineKey));
        
        if (isNew) {
          newFindings.push(line.trim());
          saveSeenListing(wine.id, line.trim());
        }
      }
    }
  }
  
  log('FIND', `🍷 ${wine.name}: ${newFindings.length} new findings`);
  
  return {
    wine,
    newFindings,
    found: newFindings.length > 0
  };
}

async function runParallelHunts(wines, config) {
  const results = [];
  
  // Process wines in batches of MAX_PARALLEL
  for (let i = 0; i < wines.length; i += MAX_PARALLEL) {
    const batch = wines.slice(i, i + MAX_PARALLEL);
    log('BATCH', `Processing batch ${Math.floor(i / MAX_PARALLEL) + 1}: ${batch.map(w => w.name.split(' ')[0]).join(', ')}`);
    
    // Run this batch in parallel
    const batchPromises = batch.map(wine => huntSingleWine(wine, config));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + MAX_PARALLEL < wines.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
}

function generateReport(allResults) {
  const winesWithFindings = allResults.filter(r => r.newFindings.length > 0);
  const timestamp = getESTTime();
  
  let report = `# Wine Hunt Report - ${timestamp} ET\n\n`;
  report += `**Total Wines Checked:** ${allResults.length}\n`;
  report += `**Wines with New Findings:** ${winesWithFindings.length}\n\n`;
  
  if (winesWithFindings.length === 0) {
    report += `📭 No new stock found today.\n\n`;
  } else {
    report += `---\n\n`;
    
    for (const result of winesWithFindings.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.wine.priority] - priorityOrder[b.wine.priority];
    })) {
      const wine = result.wine;
      report += `## ${wine.name}\n`;
      report += `**Priority:** ${wine.priority.toUpperCase()} | **Max Price:** $${wine.maxPrice}\n\n`;
      report += `**Findings:**\n`;
      
      for (const finding of result.newFindings.slice(0, 5)) {
        report += `- ${finding.substring(0, 120)}...\n`;
      }
      
      if (result.newFindings.length > 5) {
        report += `- *(${result.newFindings.length - 5} more findings in log)*\n`;
      }
      
      report += `\n**Notes:** ${wine.notes}\n\n`;
      report += `---\n\n`;
    }
  }
  
  report += `## Today's Hunt Log\n\n`;
  for (const result of allResults) {
    const emoji = result.newFindings.length > 0 ? '🍷' : '⚫';
    report += `${emoji} ${result.wine.name.split(' ').slice(0, 3).join(' ')}... ${result.newFindings.length} new\n`;
  }
  
  report += `\n*Config: ${CONFIG_FILE}*\n`;
  report += `*Next run: Tomorrow 5:00 AM ET*\n`;
  
  return report;
}

// MAIN
async function main() {
  const startTime = Date.now();
  log('START', `=== Daily Wine Hunt Started (PARALLEL v2.0) ===`);
  log('START', `Time (ET): ${getESTTime()}`);
  log('START', `Parallel limit: ${MAX_PARALLEL} wines at once`);
  
  const config = loadConfig();
  if (!config) {
    log('FATAL', 'Cannot proceed without config');
    process.exit(1);
  }
  
  const huntingWines = config.wines.filter(w => w.status === 'hunting');
  log('CONFIG', `Loaded ${config.wines.length} wines (${huntingWines.length} active)`);
  
  // Run parallel hunts
  const allResults = await runParallelHunts(huntingWines, config);
  
  // Generate report
  const report = generateReport(allResults);
  writeFileSync(REPORT_FILE, report);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('COMPLETE', `Hunt finished in ${duration}s`);
  log('COMPLETE', `Report saved to: ${REPORT_FILE}`);
  
  console.log('\n\n=== HUNT COMPLETE ===\n');
  console.log(report);
  
  process.exit(0);
}

main().catch(err => {
  log('FATAL', `Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
