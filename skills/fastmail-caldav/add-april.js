const https = require('https');
const fs = require('fs');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');

const calls = JSON.parse(fs.readFileSync('/tmp/april-calls.json'));

function createICS(date, summary, details, uid) {
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTAMP:20260213T190000Z
DTSTART;VALUE=DATE:${date.replace(/-/g, '')}
DTEND;VALUE=DATE:${date.replace(/-/g, '')}
SUMMARY:${summary}
DESCRIPTION:${details}
END:VEVENT
END:VCALENDAR`;
}

function putEvent(eventData, filename) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'caldav.fastmail.com',
            path: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/' + filename,
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'text/calendar',
                'Content-Length': Buffer.byteLength(eventData)
            }
        }, (res) => resolve(res.statusCode));
        req.on('error', () => resolve(0));
        req.write(eventData);
        req.end();
    });
}

async function main() {
    console.log('Adding April 2026 calls...\n');
    
    for (const call of calls) {
        const dateFormatted = call.date.replace(/-/g, '');
        const uid = `kulkarni-${dateFormatted}@pierre`;
        const ics = createICS(call.date, call.summary, call.details, uid);
        const status = await putEvent(ics, `kulkarni-${dateFormatted}.ics`);
        console.log(`${call.label}: ${status === 201 ? '✅' : '⚠️'} ${call.summary.replace('Kulkarni: ', '')}`);
    }
    
    console.log('\n✅ April 2026 complete!');
}

main();
