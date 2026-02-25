#!/usr/bin/env node
/**
 * Parse RMC-BMC schedule - handle weekly block structure
 */

const fs = require('fs');
const text = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l);

// State tracking
let currentWeek = null;
let collectingWeek = false;
let weekBuffer = [];
const allWeeks = [];

// Process line by line
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a week start (date pattern like 2/16 or 3/4)
    const weekStart = line.match(/^(2|3)\/([0-9]+)$/);
    
    if (weekStart) {
        // Save previous week if exists
        if (weekBuffer.length > 0) {
            allWeeks.push([...weekBuffer]);
        }
        // Start new week
        weekBuffer = [line];
        collectingWeek = true;
    } else if (collectingWeek) {
        weekBuffer.push(line);
        
        // Check if next line is a new week start
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.match(/^(2|3)\/([0-9]+)$/)) {
            allWeeks.push([...weekBuffer]);
            weekBuffer = [];
            collectingWeek = false;
        }
    }
}

// Add final week
if (weekBuffer.length > 0) {
    allWeeks.push(weekBuffer);
}

// Extract Kulkarni assignments
const kulkarniShifts = [];

for (const week of allWeeks) {
    const firstLine = week[0];
    const dateMatch = firstLine.match(/^(2|3)\/([0-9]+)$/);
    
    if (!dateMatch) continue;
    
    const month = parseInt(dateMatch[1]);
    const startDay = parseInt(dateMatch[2]);
    
    // Stop after March 17
    if (month === 3 && startDay > 17) break;
    
    // Only process Feb 16 onwards
    if (month === 2 && startDay < 16) continue;
    
    // Look for OB, R1, R2, B1, B2 lines with Kulkarni
    const weekText = week.join(' ');
    const assignments = [];
    
    // Check each role
    const roles = ['OB', 'R1', 'R2', 'B1', 'B2'];
    for (const role of roles) {
        // Find role assignments in this week
        const roleRegex = new RegExp(`${role}\\s+([^R][^0-9][^\\n]*?)(?=\\s*(?:R[12]|B[12]|OB|ANANNAB|BAYSHORE|VACATION|1\\\\s|2\\\\s|3\\\\s|$))`, 'g');
        
        // Simple line-by-line check
        for (let j = 0; j < week.length; j++) {
            const l = week[j];
            if (l.startsWith(role + ' ')) {
                const assignment = l.substring(role.length).trim();
                if (assignment.includes('Kulkarni')) {
                    assignments.push(`${role}: ${assignment}`);
                }
            }
        }
    }
    
    // Also check for Kulkarni in numbered rows (shift assignments)
    const numberedAssignments = [];
    for (let j = 0; j < week.length; j++) {
        const l = week[j];
        // Check for lines that might be shift rows with Kulkarni
        if (l.match(/^[0-9]+\s/) && l.includes('Kulkarni')) {
            numberedAssignments.push(l);
        }
    }
    
    if (assignments.length > 0 || numberedAssignments.length > 0) {
        kulkarniShifts.push({
            weekStart: firstLine,
            month: month === 2 ? 'February' : 'March',
            day: startDay,
            primaryRoles: assignments,
            shiftRows: numberedAssignments
        });
    }
}

// Output
console.log('📅 KULKARNI SHIFTS: FEB 16 - MAR 17, 2026\n');
console.log('='.repeat(60));

for (const shift of kulkarniShifts) {
    console.log(`\n📌 Week of ${shift.month} ${shift.day}, 2026`);
    if (shift.primaryRoles.length > 0) {
        console.log('   Primary Roles:');
        shift.primaryRoles.forEach(r => console.log(`      • ${r}`));
    }
    if (shift.shiftRows.length > 0) {
        console.log('   Shift Assignments:');
        shift.shiftRows.forEach(r => console.log(`      • ${r}`));
    }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total weeks with Kulkarni shifts: ${kulkarniShifts.length}`);

// Save
fs.writeFileSync('/data/workspace/memory/kulkarni-shifts-feb-mar.json', JSON.stringify(kulkarniShifts, null, 2));
console.log('\n✅ Saved to memory/kulkarni-shifts-feb-mar.json');
