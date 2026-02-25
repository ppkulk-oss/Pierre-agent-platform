#!/usr/bin/env node
const fs = require('fs');
const lines = fs.readFileSync('/data/workspace/downloads/schedule-pdf-text.txt', 'utf-8').split('\n');

// Find Feb-March section
let inRange = false;
let currentDate = null;
const kulkarniDates = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for date line
    const dateMatch = line.match(/^(2|3)\/([0-9]+)$/);
    if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        
        if (month === 2 && day >= 16) inRange = true;
        if (month === 3 && day > 17) break;
        
        if (inRange) {
            currentDate = { month, day, line: i, context: [] };
        }
    }
    
    // Collect Kulkarni mentions with context
    if (inRange && line.includes('Kulkarni') && line.length < 100) {
        kulkarniDates.push({
            date: currentDate,
            lineNum: i,
            text: line,
            context: lines.slice(Math.max(0, i-5), Math.min(lines.length, i+5))
        });
    }
}

// Group by date ranges (approximate weeks)
console.log('📅 KULKARNI APPEARANCES: FEB 16 - MAR 17, 2026\n');
console.log('='.repeat(60));

for (const item of kulkarniDates.slice(0, 30)) {
    if (item.date) {
        const monthName = item.date.month === 2 ? 'Feb' : 'Mar';
        console.log(`\n📌 Around ${monthName} ${item.date.day}:`);
    }
    console.log(`   "${item.text}"`);
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total Kulkarni mentions in range: ${kulkarniDates.length}`);
