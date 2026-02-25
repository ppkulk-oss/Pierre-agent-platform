const https = require('https');
const config = {
    hostname: 'caldav.fastmail.com',
    user: 'pierredugatpy@fastmail.com',
    pass: '256q6t8p5w5t4t3p',
    calendarPath: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/'
};

const callTypes = {
    'R1': 'Riverview 1st Call',
    'R2': 'Riverview 2nd Call',
    'B1': 'Bayshore 1st Call',
    'B2': 'Bayshore 2nd Call',
    'OB': 'On-Call'
};

// Kulkarni call assignments ONLY (R1, R2, B1, B2, OB - not pick list numbers)
const myCalls = [
    { date: '20260316', calls: ['R2', 'B1'], day: 'Mon' },
    { date: '20260317', calls: ['OB', 'B2', 'B2', 'R2', 'R1', 'OB', 'R2', 'R1', 'B1'], day: 'Tue' },
    { date: '20260318', calls: ['R1', 'OB', 'R2', 'B1', 'R1', 'B2'], day: 'Wed' },
    { date: '20260319', calls: ['R1', 'OB', 'B1', 'B1', 'B2'], day: 'Thu' },
    { date: '20260320', calls: ['R2', 'R1', 'R2', 'OB', 'B2'], day: 'Fri' }
];

function createICS(title, date, description, uid) {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pierre//CalDAV Client//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${date}
DTEND;VALUE=DATE:${date}
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
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(eventData);
        req.end();
    });
}

async function main() {
    console.log('Adding KULKARNI call schedule (R1, R2, B1, B2, OB only)...\n');
    
    for (const day of myCalls) {
        // Count occurrences
        const counts = {};
        day.calls.forEach(c => counts[c] = (counts[c] || 0) + 1);
        
        // Build summary
        const summaryParts = [];
        ['R1', 'R2', 'B1', 'B2', 'OB'].forEach(type => {
            if (counts[type]) {
                const label = counts[type] > 1 ? `${counts[type]}× ${callTypes[type]}` : callTypes[type];
                summaryParts.push(label);
            }
        });
        
        const title = `🏥 Kulkarni: ${summaryParts.join(', ')}`;
        const description = day.calls.map(c => callTypes[c]).join('\\n');
        const uid = `kulkarni-calls-${day.date}@pierre`;
        
        const ics = createICS(title, day.date, description, uid);
        const res = await putEvent(ics, `kulkarni-calls-${day.date}.ics`);
        
        console.log(`${day.day} Mar ${day.date.substring(6)}: ${res.status === 201 ? '✅' : '⚠️'} ${summaryParts.join(', ')}`);
    }
    
    console.log('\n✅ Your call schedule added!');
}

main().catch(console.error);
