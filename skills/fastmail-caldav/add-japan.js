const https = require('https');
const config = {
    hostname: 'caldav.fastmail.com',
    user: 'pierredugatpy@fastmail.com',
    pass: '256q6t8p5w5t4t3p',
    calendarPath: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/'
};

function createEvent(title, start, end, description, uid) {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pierre//CalDAV Client//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;TZID=America/New_York:${start}
DTEND;TZID=America/New_York:${end}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
}

function putEvent(eventData, filename) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${config.user}:${config.pass}`).toString('base64');
        const options = {
            hostname: config.hostname,
            port: 443,
            path: config.calendarPath + filename,
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Length': Buffer.byteLength(eventData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', reject);
        req.write(eventData);
        req.end();
    });
}

async function main() {
    // Event 1: Outbound Flight
    const outbound = createEvent(
        '✈️ Flight to Tokyo - UA79 (JWT23D)',
        '20260331T112500',
        '20260331T143000',
        'United Airlines UA79\\nEWR → NRT\\nFamily: Prashant, Tejal, Riya, Lara\\nConfirmation: JWT23D\\nSeats: 50K, 50L, 50F, 50J',
        'japan-outbound-2026@pierre'
    );

    // Event 2: Return Flight  
    const return_ = createEvent(
        '✈️ Flight to Newark - UA78 (JWT23D)',
        '20260410T171500',
        '20260410T170000',
        'United Airlines UA78\\nNRT → EWR\\nFamily: Prashant, Tejal, Riya, Lara\\nConfirmation: JWT23D\\nSeats: 51K, 51L, 51F, 51J',
        'japan-return-2026@pierre'
    );

    console.log('Adding Japan trip events...\n');
    
    const res1 = await putEvent(outbound, 'japan-outbound-2026.ics');
    console.log(`Outbound flight: ${res1.status === 201 ? '✅ Added' : '⚠️ ' + res1.status}`);
    
    const res2 = await putEvent(return_, 'japan-return-2026.ics');
    console.log(`Return flight: ${res2.status === 201 ? '✅ Added' : '⚠️ ' + res2.status}`);
    
    console.log('\n🎌 Japan trip added to calendar!');
}

main().catch(console.error);
