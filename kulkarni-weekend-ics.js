const fs = require('fs');

const weekendData = JSON.parse(fs.readFileSync('/tmp/weekend-calls-detailed.json'));

// Create ICS for weekends only, splitting Sat/Sun
let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pierre//Kulkarni Weekend Calls//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Kulkarni Weekend Calls
X-WR-TIMEZONE:America/New_York
`;

let eventCount = 0;

weekendData.forEach(wknd => {
    if (wknd.assignments.length === 0) return;
    
    const sat = wknd.sat;
    const sun = wknd.sun;
    
    // Process each assignment
    wknd.assignments.forEach(assgn => {
        const role = assgn.role;
        const cell = assgn.cell;
        
        // Determine which day(s) based on the format
        // Format examples: "Jacobson / Kulkarni" or "Kulkarni / Assiamah" or just "Kulkarni"
        const parts = cell.split('/').map(p => p.trim());
        
        if (role === 'OB' || role === 'R1' || role === 'B1') {
            // These are "on call" roles - populate BOTH days
            if (parts.length === 2) {
                const first = parts[0];
                const second = parts[1];
                
                // Saturday gets first, Sunday gets second
                const satDoctor = first;
                const sunDoctor = second;
                
                // Generate events based on who Kulkarni is
                if (satDoctor.includes('Kulkarni')) {
                    eventCount++;
                    ics += `\nBEGIN:VEVENT\n`;
                    ics += `UID:${wknd.sat}-${role}-sat@pierre\n`;
                    ics += `DTSTART;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                    ics += `DTEND;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                    ics += `SUMMARY:🏥 Kulkarni: Saturday ${role === 'R1' ? 'Riverview 1st' : role === 'B1' ? 'Bayshore 1st' : 'On-Call'}\n`;
                    ics += `DESCRIPTION:${role}${cell.includes('Farrell') ? ' with Farrell' : cell.includes('Assiamah') ? ' with Assiamah' : cell.includes('Jacobson') ? ' with Jacobson' : ''}\n`;
                    ics += `CATEGORIES:Weekend Call\n`;
                    ics += `END:VEVENT\n`;
                }
                
                if (sunDoctor.includes('Kulkarni')) {
                    eventCount++;
                    ics += `\nBEGIN:VEVENT\n`;
                    ics += `UID:${wknd.sun}-${role}-sun@pierre\n`;
                    ics += `DTSTART;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                    ics += `DTEND;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                    ics += `SUMMARY:🏥 Kulkarni: Sunday ${role === 'R1' ? 'Riverview 1st' : role === 'B1' ? 'Bayshore 1st' : 'On-Call'}\n`;
                    ics += `DESCRIPTION:${role}${cell.includes('Farrell') ? ' with Farrell' : cell.includes('Assiamah') ? ' with Assiamah' : cell.includes('Jacobson') ? ' with Jacobson' : ''}\n`;
                    ics += `CATEGORIES:Weekend Call\n`;
                    ics += `END:VEVENT\n`;
                }
            } else {
                // Single "Kulkarni" - Both days
                eventCount++;
                ics += `\nBEGIN:VEVENT\n`;
                ics += `UID:${wknd.sat}-${role}-sat@pierre\n`;
                ics += `DTSTART;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                ics += `DTEND;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                ics += `SUMMARY:🏥 Kulkarni: Saturday ${role === 'R1' ? 'Riverview 1st' : role === 'B1' ? 'Bayshore 1st' : role}\n`;
                ics += `DESCRIPTION:${role}\n`;
                ics += `CATEGORIES:Weekend Call\n`;
                ics += `END:VEVENT\n`;
                
                eventCount++;
                ics += `\nBEGIN:VEVENT\n`;
                ics += `UID:${wknd.sun}-${role}-sun@pierre\n`;
                ics += `DTSTART;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                ics += `DTEND;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                ics += `SUMMARY:🏥 Kulkarni: Sunday ${role === 'R1' ? 'Riverview 1st' : role === 'B1' ? 'Bayshore 1st' : role}\n`;
                ics += `DESCRIPTION:${role}\n`;
                ics += `CATEGORIES:Weekend Call\n`;
                ics += `END:VEVENT\n`;
            }
        } else if (role === 'R2' || role === 'B2') {
            // These are backup/2nd call - split across weekend
            if (parts.length === 2) {
                const first = parts[0];
                const second = parts[1];
                
                if (first.includes('Kulkarni')) {
                    eventCount++;
                    ics += `\nBEGIN:VEVENT\n`;
                    ics += `UID:${wknd.sat}-${role}-sat@pierre\n`;
                    ics += `DTSTART;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                    ics += `DTEND;VALUE=DATE:${sat.replace(/-/g, '')}\n`;
                    ics += `SUMMARY:🏥 Kulkarni: Saturday ${role === 'R2' ? 'Riverview 2nd' : 'Bayshore 2nd'}\n`;
                    ics += `DESCRIPTION:${role} (backup)\n`;
                    ics += `CATEGORIES:Weekend Call\n`;
                    ics += `END:VEVENT\n`;
                }
                
                if (second.includes('Kulkarni')) {
                    eventCount++;
                    ics += `\nBEGIN:VEVENT\n`;
                    ics += `UID:${wknd.sun}-${role}-sun@pierre\n`;
                    ics += `DTSTART;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                    ics += `DTEND;VALUE=DATE:${sun.replace(/-/g, '')}\n`;
                    ics += `SUMMARY:🏥 Kulkarni: Sunday ${role === 'R2' ? 'Riverview 2nd' : 'Bayshore 2nd'}\n`;
                    ics += `DESCRIPTION:${role} (backup)\n`;
                    ics += `CATEGORIES:Weekend Call\n`;
                    ics += `END:VEVENT\n`;
                }
            }
        }
    });
});

ics += 'END:VCALENDAR\n';

fs.writeFileSync('/data/workspace/kulkarni-weekend-calls.ics', ics);
console.log('✅ Weekend-only ICS created!');
console.log('File: /data/workspace/kulkarni-weekend-calls.ics');
console.log('Total weekend events: ' + eventCount);
console.log('\nWeekend summary:');

// Show summary
weekendData.forEach(w => {
    if (w.assignments.length > 0) {
        console.log(w.header + ':');
        w.assignments.forEach(a => {
            console.log('  ' + a.role + ': ' + a.cell);
        });
    }
});
