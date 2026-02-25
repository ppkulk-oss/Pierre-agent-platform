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

// First week: March 16-20, 2026
// Kulkarni assignments from each column
const weekSchedule = [
    // Monday, March 16 (Column 1)
    { date: '20260316', calls: ['13', '20', '9', '11', '9', '7', '7', '14', '1', '5', '19', '8', '18', '10', 'R2', '3', '9', '9', '15', '12', '19', '17', '14', 'B1'], day: 'Mon' },
    // Tuesday, March 17 (Column 2)
    { date: '20260317', calls: ['OB', '14', '10', '6', '14', 'B2', '10', '3', '15', '15', 'B2', '13', '3', 'R2', '5', '14', '15', '18', 'R1', '4', '14', 'OB', 'R2', '5', '1', 'R1', '4', '12', 'B1'], day: 'Tue' },
    // Wednesday, March 18 (Column 3)
    { date: '20260318', calls: ['20', 'R1', '4', '11', '10', 'OB', '2', 'R2', '5', '7', '9', '16', '11', '18', 'B1', '15', '14', '18', '19', '11', '20', '18', '17', 'R1', '4', 'B2'], day: 'Wed' },
    // Thursday, March 19 (Column 4)
    { date: '20260319', calls: ['14', '19', '13', '11', '19', '9', '16', '7', '3', 'R1', '4', 'OB', '2', '18', '10', 'B1', '15', '1', '9', 'B1', '7', '11', '2', '14', '19', 'B2'], day: 'Thu' },
    // Friday, March 20 (Column 5)
    { date: '20260320', calls: ['2', '10', '10', '14', 'R2', '5', 'R1', '3', '1', 'R2', '5', '11', '18', '19', '5', '3', '16', '18', '2', '10', '18', '10', '15', '1', 'OB', 'B2'], day: 'Fri' }
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
    console.log('Adding Week 1 (March 16-20, 2026) to calendar...\n');
    
    for (const day of weekSchedule) {
        // Group calls by type
        const summary = [];
        let desc = [];
        
        day.calls.forEach((call, idx) => {
            const callName = callTypes[call] || `Call ${call}`;
            if (!desc.includes(callName)) {
                desc.push(callName);
            }
        });
        
        // Count by type
        const counts = {};
        day.calls.forEach(c => {
            counts[c] = (counts[c] || 0) + 1;
        });
        
        const summaryParts = [];
        ['R1', 'R2', 'B1', 'B2', 'OB'].forEach(type => {
            if (counts[type]) {
                summaryParts.push(`${counts[type]}x ${callTypes[type]}`);
            }
        });
        
        const otherCalls = day.calls.filter(c => !callTypes[c]).length;
        if (otherCalls > 0) summaryParts.push(`${otherCalls} other calls`);
        
        const title = `🏥 ${day.day} ${day.date.substring(4,6)}/${day.date.substring(6)} - ${summaryParts.join(', ')}`;
        const description = desc.join('\\n');
        const uid = `call-${day.date}@pierre`;
        
        const ics = createICS(title, day.date, description, uid);
        const res = await putEvent(ics, `call-${day.date}.ics`);
        
        console.log(`${day.day} Mar ${day.date.substring(6)}: ${res.status === 201 ? '✅' : '⚠️'} ${summaryParts.join(', ')}`);
    }
    
    console.log('\n✅ Week 1 added to calendar!');
    console.log('Check your Fastmail calendar app to see how it looks.');
}

main().catch(console.error);
