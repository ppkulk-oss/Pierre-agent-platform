#!/usr/bin/env node
/**
 * Parse RMC-BMC schedule PDF text
 * Extract Kulkarni shifts through March 17, 2026
 */

const fs = require('fs');

const text = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l);

// Find February-March 2026 section
const shifts = [];
let currentWeek = null;
let currentLine = 0;

// Find start of Feb 2026
for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^2\/[0-9]+$/)) {
        currentLine = i;
        break;
    }
}

// Parse week by week
while (currentLine < lines.length) {
    const line = lines[currentLine];
    
    // Check for date line (2/16, 3/4, etc.)
    const dateMatch = line.match(/^(2|3)\/([0-9]+)$/);
    if (dateMatch) {
        const month = dateMatch[1] === '2' ? 'February' : 'March';
        const day = parseInt(dateMatch[2]);
        
        // Stop at March 18
        if (month === 'March' && day > 17) break;
        
        currentWeek = {
            dateStr: `${month} ${day}, 2026`,
            month: parseInt(dateMatch[1]),
            day: day,
            ob: '',
            r1: '',
            r2: '',
            b1: '',
            b2: '',
            assignments: []
        };
        
        // Look ahead for OB/R1/R2/B1/B2 lines
        let j = currentLine + 1;
        while (j < lines.length && !lines[j].match(/^(2|3)\/[0-9]+$/)) {
            const l = lines[j];
            
            if (l.startsWith('OB ')) currentWeek.ob = l.substring(3).trim();
            else if (l.startsWith('R1 ')) currentWeek.r1 = l.substring(3).trim();
            else if (l.startsWith('R2 ')) currentWeek.r2 = l.substring(3).trim();
            else if (l.startsWith('B1 ')) currentWeek.b1 = l.substring(3).trim();
            else if (l.startsWith('B2 ')) currentWeek.b2 = l.substring(3).trim();
            
            // Check for Kulkarni in any assignment
            if (l.includes('Kulkarni') && (l.includes('OB') || l.includes('R1') || l.includes('R2') || l.includes('B1') || l.includes('B2'))) {
                currentWeek.assignments.push(l);
            }
            
            j++;
        }
        
        // Check if Kulkarni is in this week's primary roles
        const kulkarniRoles = [];
        if (currentWeek.ob.includes('Kulkarni')) kulkarniRoles.push('OB');
        if (currentWeek.r1.includes('Kulkarni')) kulkarniRoles.push('R1');
        if (currentWeek.r2.includes('Kulkarni')) kulkarniRoles.push('R2');
        if (currentWeek.b1.includes('Kulkarni')) kulkarniRoles.push('B1');
        if (currentWeek.b2.includes('Kulkarni')) kulkarniRoles.push('B2');
        
        if (kulkarniRoles.length > 0 || currentWeek.assignments.length > 0) {
            shifts.push({
                ...currentWeek,
                kulkarniRoles,
                hasShift: true
            });
        }
    }
    
    currentLine++;
}

// Output results
console.log('📅 KULKARNI SHIFTS: FEB 16 - MAR 17, 2026\n');
console.log('='.repeat(50));

for (const shift of shifts) {
    console.log(`\n📌 ${shift.dateStr}`);
    if (shift.ob) console.log(`   OB: ${shift.ob}`);
    if (shift.r1) console.log(`   R1: ${shift.r1}`);
    if (shift.r2) console.log(`   R2: ${shift.r2}`);
    if (shift.b1) console.log(`   B1: ${shift.b1}`);
    if (shift.b2) console.log(`   B2: ${shift.b2}`);
    if (shift.kulkarniRoles.length > 0) {
        console.log(`   🎯 Kulkarni assigned: ${shift.kulkarniRoles.join(', ')}`);
    }
    if (shift.assignments.length > 0) {
        console.log(`   📝 Notes: ${shift.assignments.join('; ')}`);
    }
}

// Save to file
const output = {
    generated: new Date().toISOString(),
    period: 'Feb 16 - Mar 17, 2026',
    shifts
};

fs.writeFileSync('/data/workspace/memory/oncall-schedule-feb-mar-2026.json', JSON.stringify(output, null, 2));
console.log('\n\n✅ Saved to: memory/oncall-schedule-feb-mar-2026.json');
