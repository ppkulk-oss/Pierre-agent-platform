#!/usr/bin/env node
const fs = require('fs');
const lines = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8').split('\n').map(l => l.trim()).filter(l => l);

const kulkarniShifts = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find week start - look for date headers
    const weekMatch = line.match(/^(2|3)\/([0-9]+)(?:-3\/([0-9]+))?$/);
    if (!weekMatch) continue;
    
    const month = parseInt(weekMatch[1]);
    const startDay = parseInt(weekMatch[2]);
    const weekendEnd = weekMatch[3] ? parseInt(weekMatch[3]) : null; // For 2/28-3/1 pattern
    
    // Only process Feb 16 - Mar 17
    if (month === 2 && startDay < 16) continue;
    if (month === 3 && startDay > 17) break;
    
    // Build date columns for this week
    const dateCols = [];
    if (weekendEnd) {
        // Weekend combined column like 2/28-3/1
        for (let d = startDay; d <= (month === 2 ? 28 : 31); d++) {
            dateCols.push({month, day: d});
        }
        dateCols.push({month: 3, day: weekendEnd}); // March 1
    } else {
        // Normal week - figure out 6 days
        for (let offset = 0; offset < 6; offset++) {
            let d = startDay + offset;
            let m = month;
            // Handle month boundary
            if (month === 2 && d > 28) {
                d = d - 28;
                m = 3;
            }
            if (m === 3 && d > 31) break;
            if (m === 3 && d > 17 && month === 2) break; // Stop at Mar 17
            dateCols.push({month: m, day: d});
        }
    }
    
    // Find role sections
    let j = i + 1;
    let currentRole = null;
    let colIndex = 0;
    
    while (j < lines.length && !lines[j].match(/^(2|3)\/[0-9]/)) {
        const wl = lines[j];
        
        // Check for role header
        const roleHeader = wl.match(/^(OB|R1|R2|B1|B2)(?:\s+(.+))?$/);
        if (roleHeader) {
            currentRole = roleHeader[1];
            colIndex = 0;
            
            // Check same line
            const name = roleHeader[2] || '';
            if (name.includes('Kulkarni') && colIndex < dateCols.length) {
                const d = dateCols[colIndex];
                if (d.month === 3 && d.day > 17) break;
                kulkarniShifts.push({
                    date: `${d.month === 2 ? 'Feb' : 'Mar'} ${d.day}`,
                    month: d.month, day: d.day,
                    role: currentRole,
                    context: name
                });
            }
            colIndex++;
            j++;
            continue;
        }
        
        // Names under role
        if (currentRole && colIndex < dateCols.length) {
            if (wl.includes('Kulkarni')) {
                const d = dateCols[colIndex];
                if (d.month === 3 && d.day > 17) break;
                kulkarniShifts.push({
                    date: `${d.month === 2 ? 'Feb' : 'Mar'} ${d.day}`,
                    month: d.month, day: d.day,
                    role: currentRole,
                    context: wl
                });
            }
            colIndex++;
        }
        
        // Reset at numbered rows
        if (wl.match(/^[0-9]{1,2}$/) && !wl.match(/^(2|3)\//)) {
            currentRole = null;
        }
        
        j++;
    }
}

// Output
console.log('📅 KULKARNI PRIMARY CALL ASSIGNMENTS\n');
console.log('Feb 16 - Mar 17, 2026 (OB/R1/R2/B1/B2 only)\n');
console.log('='.repeat(50));

// Sort by date
kulkarniShifts.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
});

for (const s of kulkarniShifts) {
    console.log(`\n📌 ${s.date}: ${s.role}`);
}

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Total: ${kulkarniShifts.length} call assignments`);

// Save
fs.writeFileSync('/data/workspace/memory/kulkarni-primary-call.json', JSON.stringify(kulkarniShifts, null, 2));
console.log('\n✅ Saved to memory/kulkarni-primary-call.json');
