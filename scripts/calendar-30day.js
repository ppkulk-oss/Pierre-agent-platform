#!/usr/bin/env node
/**
 * Fastmail Calendar - 30 day view
 */

const config = {
    username: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p'
};

const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

async function makeRequest(url, method, body, depth = '0') {
    return fetch(url, {
        method,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/xml; charset=utf-8',
            'Depth': depth
        },
        body
    });
}

function parseICalDate(icalDate) {
    // Parse 20260220T140000Z format
    const str = icalDate.replace(/[^0-9]/g, '');
    if (str.length >= 8) {
        const year = str.substring(0, 4);
        const month = str.substring(4, 6);
        const day = str.substring(6, 8);
        if (str.length >= 14) {
            const hour = str.substring(9, 11);
            const min = str.substring(11, 13);
            return `${year}-${month}-${day} ${hour}:${min}`;
        }
        return `${year}-${month}-${day}`;
    }
    return icalDate;
}

async function main() {
    console.log('📅 Prashant\'s Calendar - 30 Day View\n');
    
    const calUrl = 'https://caldav.fastmail.com/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/';
    
    // Get events for next 30 days
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:D="DAV:">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"
                      end="${nextMonth.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
    
    console.log('Fetching next 30 days...\n');
    const res = await makeRequest(calUrl, 'REPORT', body, '1');
    const text = await res.text();
    
    if (!text.includes('VEVENT')) {
        console.log('📭 No events found in next 30 days');
        console.log('\nPossible reasons:');
        console.log('  - Calendar is empty');
        console.log('  - Events are in a different calendar');
        console.log('  - Events are older or further in future');
        return;
    }
    
    console.log('✅ Events found!\n');
    
    // Parse events
    const events = text.split('BEGIN:VEVENT').slice(1);
    
    events.forEach((evt, i) => {
        const summary = evt.match(/SUMMARY:([^\r\n]+)/);
        const start = evt.match(/DTSTART(?:;[^\r\n]+)?:([^\r\n]+)/);
        const end = evt.match(/DTEND(?:;[^\r\n]+)?:([^\r\n]+)/);
        const location = evt.match(/LOCATION:([^\r\n]+)/);
        
        console.log(`📌 Event ${i + 1}:`);
        console.log(`   Title: ${summary ? summary[1] : 'No title'}`);
        if (start) console.log(`   Start: ${parseICalDate(start[1])}`);
        if (end) console.log(`   End: ${parseICalDate(end[1])}`);
        if (location) console.log(`   Location: ${location[1]}`);
        console.log('');
    });
}

main().catch(console.error);
