const https = require('https');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');

const r2Calls = [
    { date: '20260321', label: 'Sat Mar 21', day: 'Sat' },
    { date: '20260419', label: 'Sun Apr 19', day: 'Sun' },
    { date: '20260523', label: 'Sat May 23', day: 'Sat' },
    { date: '20260802', label: 'Sun Aug 2', day: 'Sun' }
];

function createICS(date, day, uid) {
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTAMP:20260213T213000Z
DTSTART;VALUE=DATE:${date}
DTEND;VALUE=DATE:${date}
SUMMARY:🏥 Kulkarni: R2 (Riverview 2nd) - ${day}
DESCRIPTION:R2 - Riverview 2nd Call (weekend backup)\n${day}
END:VEVENT
END:VCALENDAR`;
}

function putEvent(ics, filename) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'caldav.fastmail.com',
            path: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/' + filename,
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'text/calendar',
                'Content-Length': Buffer.byteLength(ics)
            }
        }, (res) => resolve(res.statusCode));
        req.on('error', () => resolve(0));
        req.write(ics);
        req.end();
    });
}

async function main() {
    console.log('Adding R2 weekend calls...\n');
    
    for (const c of r2Calls) {
        const uid = `kulkarni-r2-${c.date}@pierre`;
        const ics = createICS(c.date, c.day, uid);
        const status = await putEvent(ics, `kulkarni-r2-${c.date}.ics`);
        console.log(`${c.label}: ${status === 201 ? '✅' : '⚠️'} R2`);
    }
    
    console.log('\n✅ R2 calls added!');
}

main();
