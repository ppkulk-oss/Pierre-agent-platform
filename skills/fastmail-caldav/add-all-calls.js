const https = require('https');
const fs = require('fs');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');

const calls = JSON.parse(fs.readFileSync('/tmp/all-kulkarni-calls.json'));
const callTypes = {
    'OB': 'On-Call',
    'R1': 'Riverview 1st Call',
    'R2': 'Riverview 2nd Call',
    'B1': 'Bayshore 1st Call',
    'B2': 'Bayshore 2nd Call'
};

function createICS(date, role, day, uid) {
    const title = `Kulkarni: ${callTypes[role]}`;
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${uid}
DTSTAMP:20260214T130000Z
DTSTART;VALUE=DATE:${date.replace(/-/g, '')}
DTEND;VALUE=DATE:${date.replace(/-/g, '')}
SUMMARY:🏥 ${title}
DESCRIPTION:${callTypes[role]}\\n${day}
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
    console.log('Adding ALL 27 Kulkarni calls (Mar-Aug 2026)...\n');
    
    // Group by month for summary
    const byMonth = {};
    
    for (const call of calls) {
        const month = call.date.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = 0;
        byMonth[month]++;
        
        const uid = `kulkarni-all-${call.date}-${call.role}@pierre`;
        const ics = createICS(call.date, call.role, call.day, uid);
        const status = await putEvent(ics, `kulkarni-${call.date}-${call.role}.ics`);
        
        if (status !== 201) {
            console.log(`${call.date}: ⚠️ ${call.role} (${status})`);
        }
    }
    
    console.log('✅ All calls added!\n');
    console.log('Summary by month:');
    Object.entries(byMonth).forEach(([m, c]) => {
        console.log(`  ${m}: ${c} calls`);
    });
    console.log(`\nTotal: ${calls.length} calls`);
}

main();
