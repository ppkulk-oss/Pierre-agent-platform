#!/usr/bin/env node
/**
 * On-Call Alert System v2 - Hardcoded verified dates
 */

const verifiedShifts = [
    { date: '2026-02-19', title: 'OB', note: 'Today!' },
    { date: '2026-02-21', title: 'R1 (Weekend)', note: 'Weekend shift' },
    { date: '2026-02-24', title: 'R2', note: '' },
    { date: '2026-02-28', title: 'B2', note: 'Weekend' },
    { date: '2026-03-01', title: 'B2', note: 'Weekend' },
    { date: '2026-03-17', title: 'On-Call (Multi)', note: '2×R1, 2×R2, B1, 2×B2' },
    { date: '2026-03-21', title: 'OB Weekend', note: 'With Jacobson' }
];

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function checkTomorrowAlerts() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const alerts = verifiedShifts.filter(s => s.date === tomorrowStr);
    
    console.log('📅 ON-CALL ALERT CHECK\n');
    console.log('='.repeat(50));
    
    if (alerts.length === 0) {
        console.log('\n✅ No on-call shift tomorrow');
        console.log('\n📆 Upcoming shifts:');
        verifiedShifts.forEach(s => {
            const d = new Date(s.date + 'T00:00:00');
            const daysUntil = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
            if (daysUntil > 0 && daysUntil <= 14) {
                console.log(`   ${formatDate(s.date)} (${daysUntil} days): ${s.title}`);
            }
        });
        return 0;
    }
    
    console.log('\n🚨 TOMORROW ALERT:\n');
    for (const alert of alerts) {
        console.log(`📌 ${formatDate(alert.date)}`);
        console.log(`   Role: ${alert.title}`);
        if (alert.note) console.log(`   Note: ${alert.note}`);
        console.log('');
    }
    
    return 1;
}

const exitCode = checkTomorrowAlerts();
console.log('\n' + '='.repeat(50));
process.exit(exitCode);
