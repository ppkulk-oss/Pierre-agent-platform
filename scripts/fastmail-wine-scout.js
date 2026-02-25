#!/usr/bin/env node
/**
 * Fastmail Wine Allocation Scout
 * Monitors pierredugatpy@fastmail.com for wine alerts
 * Run daily during heartbeat or manually
 */

const { readEmails } = require('/data/workspace/skills/fastmail-reader/index.js');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');

const MEMORY_FILE = '/data/workspace/memory/fastmail-wine-alerts.md';
const LAST_CHECK_FILE = '/data/workspace/memory/fastmail-last-check.txt';

// Keywords to watch for
const WINE_KEYWORDS = [
  'clape', 'gonon', 'allemand', 'cornas', 'reynard',
  'allocation', 'arrival', 'new release', 'just landed',
  'saint-joseph', 'vieilles vignes', 'pre-arrival',
  'northern rhône', 'granite', 'whole cluster'
];

const RETAILERS = [
  'kermit lynch', 'crush wine', 'rare wine co', 'sommpicks',
  'klwines', 'saratoga wine'
];

function getLastCheckTime() {
  try {
    if (existsSync(LAST_CHECK_FILE)) {
      return parseInt(readFileSync(LAST_CHECK_FILE, 'utf-8'));
    }
  } catch (e) {}
  return 0;
}

function saveLastCheckTime() {
  writeFileSync(LAST_CHECK_FILE, Date.now().toString());
}

function isNewEmail(emailDate, lastCheck) {
  if (!emailDate) return true;
  const emailTime = new Date(emailDate).getTime();
  return emailTime > lastCheck;
}

function scanEmailForWines(email) {
  const matches = [];
  const text = `${email.subject} ${email.from}`.toLowerCase();
  
  for (const keyword of WINE_KEYWORDS) {
    if (text.includes(keyword)) {
      matches.push(keyword);
    }
  }
  
  const isFromRetailer = RETAILERS.some(r => email.from.toLowerCase().includes(r));
  
  return {
    hasMatch: matches.length > 0,
    matches: [...new Set(matches)],
    isFromRetailer,
    priority: matches.includes('clape') || matches.includes('allemand') ? 'HIGH' : 'MEDIUM'
  };
}

function generateAlert(emails) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  let alert = `🍷 WINE ALERT - ${timestamp} ET\n\n`;
  
  for (const email of emails) {
    alert += `**${email.priority} PRIORITY**\n`;
    alert += `From: ${email.from}\n`;
    alert += `Subject: ${email.subject}\n`;
    alert += `Matches: ${email.matches.join(', ')}\n`;
    alert += `Date: ${email.date}\n\n`;
  }
  
  alert += `---\n`;
  alert += `Action: Check Fastmail immediately - allocations sell out fast!\n`;
  alert += `Fastmail: pierredugatpy@fastmail.com\n`;
  
  return alert;
}

async function main() {
  console.log('🔍 Scanning Fastmail for wine allocations...');
  
  const lastCheck = getLastCheckTime();
  saveLastCheckTime();
  
  try {
    const emails = await readEmails();
    const wineEmails = [];
    
    for (const email of emails) {
      if (!isNewEmail(email.date, lastCheck)) {
        console.log(`Skipping old email: ${email.subject}`);
        continue;
      }
      
      const scan = scanEmailForWines(email);
      if (scan.hasMatch && scan.isFromRetailer) {
        wineEmails.push({
          ...email,
          ...scan
        });
        console.log(`🍷 FOUND: ${email.subject}`);
        console.log(`   Keywords: ${scan.matches.join(', ')}`);
      }
    }
    
    if (wineEmails.length > 0) {
      const alert = generateAlert(wineEmails);
      writeFileSync(MEMORY_FILE, alert);
      console.log('\n' + alert);
      process.exit(0); // Found alerts
    } else {
      console.log('📭 No wine allocation emails found.');
      process.exit(1); // No alerts
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
