#!/usr/bin/env node
const fs = require('fs');
const lines = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8').split('\n').map(l => l.trim()).filter(l => l);

const shifts = [];
let currentWeekStart = null;
let currentWeekOB = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for week start date
    const dateMatch = line.match(/^(2|3)\/([0-9]+)$/);
    if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        
        // Only Feb 16 - Mar 17
        if (month === 2 && day < 16) continue;
        if (month === 3 && day > 17) break;
        
        currentWeekStart = { month, day, str: `${month === 2 ? 'Feb' : 'Mar'} ${day}` };
        currentWeekOB = null;
        continue;
    }
    
    if (!currentWeekStart) continue;
    
    // Check for OB/R1/R2/B1/B2 lines with Kulkarni
    const roleMatch = line.match(/^(OB|R1|R2|B1|B2)\s+(.+)$/);
    if (roleMatch) {
        const role = roleMatch[1];
        const names = roleMatch[2];
        
        if (names.includes('Kulkarni')) {
            shifts.push({
                week: currentWeekStart.str,
                month: currentWeekStart.month,
                day: currentWeekStart.day,
                role: role,
                assignment: names
            });
        }
    }
}

// Output
console.log('📅 KULKARNI PRIMARY CALL ASSIGNMENTS');
console.log('(OB/R1/R2/B1/B2 only)');
console.log('Feb 16 - Mar 17, 2026\n');
console.log('='.repeat(60));

const byWeek = {};
for (const s of shifts) {
    if (!byWeek[s.week]) byWeek[s.week] = [];
    byWeek[s.week].push(s);
}

for (const [week, assignments] of Object.entries(byWeek)) {
    console.log(`\n📌 Week of ${week}:`);
    for (const a of assignments) {
        console.log(`   ${a.role}: ${a.assignment}`);
    }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total primary call assignments: ${shifts.length}`);

// Save clean data
fs.writeFileSync('/data/workspace/memory/kulkarni-primary-call-feb-mar.json', JSON.stringify(shifts, null, 2));
console.log('\n✅ Saved to memory/kulkarni-primary-call-feb-mar.json');
