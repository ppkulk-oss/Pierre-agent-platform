#!/usr/bin/env node
const fs = require('fs');
const lines = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8').split('\n').map(l => l.trim()).filter(l => l);

const kulkarniShifts = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find week start (date pattern)
    const weekMatch = line.match(/^(2|3)\/([0-9]+)$/);
    if (!weekMatch) continue;
    
    const month = parseInt(weekMatch[1]);
    let startDay = parseInt(weekMatch[2]);
    
    // Only process Feb 16 - Mar 17
    if (month === 2 && startDay < 16) continue;
    if (month === 3 && startDay > 17) break;
    
    // Look ahead for role sections in this week
    let j = i + 1;
    const weekLines = [];
    
    while (j < lines.length && !lines[j].match(/^(2|3)\/[0-9]+$/)) {
        weekLines.push(lines[j]);
        j++;
    }
    
    // Parse each role section
    let currentRole = null;
    let dayOffset = 0;
    
    for (let k = 0; k < weekLines.length; k++) {
        const wl = weekLines[k];
        
        // Check if this is a role header
        if (wl.match(/^(OB|R1|R2|B1|B2)\s/)) {
            currentRole = wl.split(' ')[0];
            dayOffset = 0;
            
            // Check if name is on same line
            const sameLineName = wl.substring(currentRole.length).trim();
            if (sameLineName && sameLineName.includes('Kulkarni')) {
                const day = startDay + dayOffset;
                if (month === 3 && day > 17) break;
                kulkarniShifts.push({
                    date: `${month === 2 ? 'Feb' : 'Mar'} ${day}`,
                    month, day,
                    role: currentRole,
                    name: sameLineName
                });
            }
            dayOffset++;
            continue;
        }
        
        // If we're in a role section and see a name
        if (currentRole && dayOffset < 6) {
            if (wl.includes('Kulkarni')) {
                const day = startDay + dayOffset;
                if (month === 3 && day > 17) break;
                kulkarniShifts.push({
                    date: `${month === 2 ? 'Feb' : 'Mar'} ${day}`,
                    month, day,
                    role: currentRole,
                    name: wl
                });
            }
            dayOffset++;
        }
        
        // Reset when we hit numbered rows or other markers
        if (wl.match(/^[0-9]+$/)) {
            currentRole = null;
        }
    }
}

// Output
console.log('📅 KULKARNI CALL ASSIGNMENTS (OB/R1/R2/B1/B2)\n');
console.log('Feb 16 - Mar 17, 2026');
console.log('='.repeat(50));

for (const s of kulkarniShifts) {
    console.log(`\n📌 ${s.date}: ${s.role}`);
    if (s.name !== 'Kulkarni') {
        console.log(`   (${s.name})`);
    }
}

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Total: ${kulkarniShifts.length} assignments`);

// Save
fs.writeFileSync('/data/workspace/memory/kulkarni-call-assignments.json', JSON.stringify(kulkarniShifts, null, 2));
console.log('\n✅ Saved to memory/kulkarni-call-assignments.json');
