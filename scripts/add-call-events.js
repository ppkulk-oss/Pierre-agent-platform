#!/usr/bin/env node
/**
 * Add Kulkarni call shifts to Fastmail Calendar
 */

const config = {
    username: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    calendarUrl: 'https://caldav.fastmail.com/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/'
};

const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

// Generate UUID for event
function generateUID() {
    return 'kulkarni-call-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}

// Create VEVENT
function createEvent(title, date, role) {
    const uid = generateUID();
    const dateStr = date.replace(/-/g, '');
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pierre//OnCall Reminder//EN
BEGIN:VEVENT
UID:${uid}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:${title}
DESCRIPTION:Role: ${role}\nAuto-added by Pierre
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

async function addEvent(title, date, role) {
    const eventData = createEvent(title, date, role);
    const url = config.calendarUrl + generateUID() + '.ics';
    
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': auth,
            'Content-Type': 'text/calendar; charset=utf-8'
        },
        body: eventData
    });
    
    return res.status === 201 || res.status === 204;
}

async function main() {
    console.log('📅 Adding Kulkarni call shifts to calendar...\n');
    
    const shifts = [
        { date: '2026-02-19', title: '🏥 Kulkarni: OB', role: 'OB' },
        { date: '2026-02-21', title: '🏥 Kulkarni: R1 (Weekend)', role: 'R1' },
        { date: '2026-02-24', title: '🏥 Kulkarni: R2', role: 'R2' },
        { date: '2026-02-28', title: '🏥 Kulkarni: B2', role: 'B2' },
        { date: '2026-03-01', title: '🏥 Kulkarni: B2', role: 'B2' },
        { date: '2026-03-17', title: '🏥 Kulkarni: On-Call (Multi)', role: 'OB/R1/R2/B1/B2' },
        { date: '2026-03-21', title: '🏥 Kulkarni: OB Weekend (Jacobson)', role: 'OB' }
    ];
    
    for (const shift of shifts) {
        process.stdout.write(`Adding ${shift.date}: ${shift.title}... `);
        try {
            const success = await addEvent(shift.title, shift.date, shift.role);
            console.log(success ? '✅' : '❌');
        } catch (err) {
            console.log('❌', err.message);
        }
    }
    
    console.log('\n✅ Calendar update complete!');
}

main().catch(console.error);
