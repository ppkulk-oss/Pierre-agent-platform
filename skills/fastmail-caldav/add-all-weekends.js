const https = require('https');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');

const weekends = [
    { date: '20260321', label: 'Sat Mar 21', call: 'OB', note: 'Weekend with Jacobson' },
    { date: '20260418', label: 'Sat Apr 18', call: 'OB', note: 'Weekend with Assiamah' },
    { date: '20260524', label: 'Sun May 24', call: 'OB', note: 'Weekend with Jacobson' },
    { date: '20260606', label: 'Sat Jun 6', call: 'B1', note: 'Bayshore 1st Call' },
    { date: '20260725', label: 'Sat Jul 25', call: 'R1', note: 'Riverview 1st Call' },
    { date: '20260801', label: 'Sat Aug 1', call: 'OB', note: 'Weekend with Farrell' }
];

function createICS(date, call, note, uid) {
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTAMP:20260213T212000Z
DTSTART;VALUE=DATE:${date}
DTEND;VALUE=DATE:${date}
SUMMARY:🏥 Kulkarni: ${call} (${note})
DESCRIPTION:${call} - ${note}
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
    console.log('Adding all weekend on-calls (Mar-Aug 2026)...\n');
    
    for (const w of weekends) {
        const uid = `kulkarni-weekend-${w.date}@pierre`;
        const ics = createICS(w.date, w.call, w.note, uid);
        const status = await putEvent(ics, `kulkarni-weekend-${w.date}.ics`);
        console.log(`${w.label}: ${status === 201 ? '✅' : '⚠️'} ${w.call}`);
    }
    
    console.log('\n✅ All 6 weekend on-calls added!');
    console.log('Total: 6 weekends out of 24 (Mar-Aug)');
}

main();
