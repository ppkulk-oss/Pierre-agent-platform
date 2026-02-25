const https = require('https');
const auth = Buffer.from('pierredugatpy@fastmail.com:256q6t8p5w5t4t3p').toString('base64');
const dates = ['20260316', '20260317', '20260318', '20260319', '20260320'];

async function deleteEvent(filename) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'caldav.fastmail.com',
            path: '/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/' + filename,
            method: 'DELETE',
            headers: { 'Authorization': 'Basic ' + auth }
        };
        const req = https.request(options, (res) => resolve(res.statusCode));
        req.on('error', () => resolve(0));
        req.end();
    });
}

async function main() {
    console.log('Removing previous entries...');
    for (const date of dates) {
        const status = await deleteEvent('call-' + date + '.ics');
        console.log(date + ': ' + (status === 204 ? 'Deleted' : status));
    }
    console.log('Done');
}

main();
