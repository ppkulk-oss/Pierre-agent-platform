const https = require('https');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');

const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:kulkarni-20260325@pierre
DTSTAMP:20260213T182200Z
DTSTART;VALUE=DATE:20260325
DTEND;VALUE=DATE:20260325
SUMMARY:Kulkarni: R1 (Riverview 1st Call)
DESCRIPTION:R1 - Riverview 1st Call
END:VEVENT
END:VCALENDAR`;

const req = https.request({
    hostname: 'caldav.fastmail.com',
    path: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/kulkarni-20260325.ics',
    method: 'PUT',
    headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'text/calendar',
        'Content-Length': Buffer.byteLength(ics)
    }
}, (res) => {
    console.log('Mar 25 R1:', res.statusCode === 201 ? '✅ Added' : 'Error ' + res.statusCode);
});
req.write(ics);
req.end();
