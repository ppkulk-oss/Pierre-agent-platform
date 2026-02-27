#!/usr/bin/env node
/**
 * Fastmail Wine Allocation Scout
 * Monitors pierredugatpy@fastmail.com for wine alerts
 * 
 * CRITERIA (per Prashant's taste):
 * - Terroir-driven, structured wines
 * - NO fruit bombs, bulk plonk, mass-produced garbage
 * - Look for: Grand Cru, 1er Cru, single vineyard, old vines
 * - Regions: Burgundy, Northern Rhône, serious Bordeaux
 * - Target: Value deals like 2006 Haut-Brion @ $450
 * 
 * Run daily during heartbeat or manually
 */

const { readEmails } = require('/data/workspace/skills/fastmail-reader/index.js');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');

const MEMORY_FILE = '/data/workspace/memory/fastmail-wine-alerts.md';
const LAST_CHECK_FILE = '/data/workspace/memory/fastmail-last-check.txt';

// === QUALITY INDICATORS (good signs) ===
const QUALITY_MARKERS = [
  'grand cru', 'premier cru', '1er cru', 'vieilles vignes', 'old vines',
  'single vineyard', 'estate bottled', 'mise en bouteille au château',
  'organic', 'biodynamic', 'lutte raisonnée', 'natural wine',
  'single parcel', 'monopole', 'clos', 'ferme',
  '2019', '2020', '2021',  // Recent good vintages for Burgundy
  '2016', '2018', '2019',  // Good Bordeaux vintages
  'library release', 'back vintage', 'cellar release'
];

// === BLACKLIST (stuff to ignore) ===
const SHIT_WINE_TERMS = [
  '90 point', '93 point', '94 point', // Parkerized scores
  'smooth', 'jammy', 'rich', 'opulent', 'luxurious', // Fruit bomb descriptors
  'sustainable', 'eco-friendly', // Meaningless marketing
  'california cabernet', 'napa valley', // Wrong style
  'australia', 'chile', 'argentina', // Not his regions (generally)
  'blend', 'proprietary red', // Bulk wine markers
  'case', 'magnum special', // Volume plays
  'introductory price', 'doorbuster' // Cheap stuff
];

// === TARGET PRODUCERS (always alert on these) ===
const UNICORNS = [
  'clape', 'gonon', 'allemand', 'chave', 'jamet',
  'dugat-py', 'roumier', 'mugnier', 'vogüé', 'leroy',
  'ramonet', 'lafon', 'coche-dury'
];

// === DEAL KEYWORDS (value indicators) ===
const DEAL_MARKERS = [
  'closeout', 'clearance', 'library release', 'back vintage',
  'was $', 'reduced', 'sale', 'half price', 'under $',
  'cellar release', 'estate library'
];

// === REGIONS OF INTEREST ===
const TARGET_REGIONS = [
  'burgundy', 'bourgogne', 'côte de nuits', 'côte de beaune',
  'cornas', 'hermitage', 'côte-rôtie', 'saint-joseph',
  'bordeaux', 'pomerol', 'margaux', 'pauillac', 'saint-émilion'
];

const RETAILERS = [
  'kermit lynch', 'crush wine', 'rare wine co', 'sommpicks',
  'klwines', 'saratoga wine', 'winebid', 'wine searcher',
  'vinous', 'jancis robinson'
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

function scoreEmail(email) {
  const text = `${email.subject} ${email.body || ''}`.toLowerCase();
  let score = 0;
  let reasons = [];
  
  // Check for unicorn producers (instant alert)
  for (const unicorn of UNICORNS) {
    if (text.includes(unicorn)) {
      score += 100;
      reasons.push(`UNICORN: ${unicorn}`);
    }
  }
  
  // Quality markers (good signs)
  for (const marker of QUALITY_MARKERS) {
    if (text.includes(marker)) {
      score += 10;
      reasons.push(`quality: ${marker}`);
    }
  }
  
  // Deal markers (value indicators)
  for (const deal of DEAL_MARKERS) {
    if (text.includes(deal)) {
      score += 15;
      reasons.push(`deal: ${deal}`);
    }
  }
  
  // Target regions
  for (const region of TARGET_REGIONS) {
    if (text.includes(region)) {
      score += 5;
      reasons.push(`region: ${region}`);
    }
  }
  
  // Penalize shit wines
  for (const shit of SHIT_WINE_TERMS) {
    if (text.includes(shit)) {
      score -= 50;
      reasons.push(`AVOID: ${shit}`);
    }
  }
  
  // From trusted retailer bonus
  const isFromRetailer = RETAILERS.some(r => email.from.toLowerCase().includes(r));
  if (isFromRetailer) score += 5;
  
  return { score, reasons, isFromRetailer };
}

function scanEmailForWines(email) {
  const { score, reasons, isFromRetailer } = scoreEmail(email);
  
  // Must be from trusted retailer AND score high enough
  if (!isFromRetailer) return { hasMatch: false };
  
  // Unicorn sightings always alert regardless of score
  const hasUnicorn = reasons.some(r => r.startsWith('UNICORN'));
  
  // Deal + quality combo = alert
  const hasDeal = reasons.some(r => r.startsWith('deal:'));
  const hasQuality = reasons.some(r => r.startsWith('quality:'));
  
  // Threshold: either unicorn, or (deal + quality) combo, or score >= 25
  const shouldAlert = hasUnicorn || (hasDeal && hasQuality) || score >= 25;
  
  let priority = 'LOW';
  if (hasUnicorn) priority = 'UNICORN 🦄';
  else if (score >= 40) priority = 'HIGH';
  else if (score >= 25) priority = 'MEDIUM';
  
  return {
    hasMatch: shouldAlert,
    score,
    reasons: reasons.slice(0, 8), // Limit reasons shown
    priority,
    isFromRetailer
  };
}

function generateAlert(emails) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  let alert = `🍷 WINE SCOUT ALERT - ${timestamp} ET\n`;
  alert += `Criteria: Terroir-driven, structured wines. NO fruit bombs.\n\n`;
  
  for (const email of emails) {
    alert += `**${email.priority}** (score: ${email.score})\n`;
    alert += `From: ${email.from}\n`;
    alert += `Subject: ${email.subject}\n`;
    alert += `Why: ${email.reasons.join(', ')}\n`;
    alert += `Date: ${email.date}\n\n`;
  }
  
  alert += `---\n`;
  alert += `Action: Check Fastmail for details\n`;
  alert += `Fastmail: pierredugatpy@fastmail.com\n`;
  alert += `\nRemember: Looking for deals like 2006 Haut-Brion @ $450\n`;
  
  return alert;
}

async function main() {
  console.log('🔍 Scanning Fastmail for QUALITY wine deals...');
  console.log('Criteria: Terroir-driven, structured, no fruit bombs\n');
  
  const lastCheck = getLastCheckTime();
  saveLastCheckTime();
  
  try {
    const emails = await readEmails();
    const wineEmails = [];
    
    for (const email of emails) {
      if (!isNewEmail(email.date, lastCheck)) {
        console.log(`Skipping old email: ${email.subject.substring(0, 50)}...`);
        continue;
      }
      
      const scan = scanEmailForWines(email);
      if (scan.hasMatch) {
        wineEmails.push({
          ...email,
          ...scan
        });
        console.log(`🍷 ${scan.priority}: ${email.subject.substring(0, 50)}...`);
        console.log(`   Score: ${scan.score}, Reasons: ${scan.reasons.slice(0, 4).join(', ')}`);
      } else if (scan.isFromRetailer) {
        console.log(`📧 Skipped (low score ${scan.score}): ${email.subject.substring(0, 40)}...`);
      }
    }
    
    if (wineEmails.length > 0) {
      const alert = generateAlert(wineEmails);
      writeFileSync(MEMORY_FILE, alert);
      console.log('\n' + '='.repeat(50));
      console.log(alert);
      process.exit(0); // Found alerts
    } else {
      console.log('\n📭 No quality wine deals found.');
      console.log('Allemand keeps searching... 👀');
      process.exit(1); // No alerts
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
