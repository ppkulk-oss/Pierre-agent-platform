const fs = require('fs');

const calls = JSON.parse(fs.readFileSync('/tmp/all-kulkarni-calls.json'));
const callTypes = {
    'OB': 'On-Call',
    'R1': 'Riverview 1st Call',
    'R2': 'Riverview 2nd Call',
    'B1': 'Bayshore 1st Call',
    'B2': 'Bayshore 2nd Call'
};

// Create combined ICS file for Google Calendar import
let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pierre//Kulkarni Call Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Kulkarni Call Schedule
X-WR-TIMEZONE:America/New_York
`;

calls.forEach((call, idx) => {
    const uid = `kulkarni-${call.date}-${call.role}-${idx}@pierre`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtstart = call.date.replace(/-/g, '');
    
    icsContent += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtstart}
SUMMARY:Kulkarni: ${callTypes[call.role]}
DESCRIPTION:${callTypes[call.role]} - ${call.day}
CATEGORIES:Call Schedule
END:VEVENT
`;
});

icsContent += 'END:VCALENDAR\n';

fs.writeFileSync('/data/workspace/kulkarni-calls-export.ics', icsContent);
console.log('✅ Export file created: /data/workspace/kulkarni-calls-export.ics');
console.log(`Total events: ${calls.length}`);
console.log('\nTo import to Google Calendar:');
console.log('1. Go to Google Calendar → Settings');
console.log('2. Click "Import & Export"');
console.log('3. Select the .ics file');
console.log('4. Choose your calendar and import');
