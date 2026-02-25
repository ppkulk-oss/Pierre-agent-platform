#!/usr/bin/env node
/**
 * Fastmail Calendar Reader - Fixed parsing
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

async function main() {
    console.log('📅 Fastmail Calendar Discovery\n');
    
    const calendarHome = 'https://caldav.fastmail.com/dav/calendars/user/pierredugatpy@fastmail.com/';
    console.log('Calendar home:', calendarHome);
    
    // List all calendars
    const listBody = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`;
    
    console.log('\n📋 Listing calendars...');
    const listRes = await makeRequest(calendarHome, 'PROPFIND', listBody, '1');
    const listText = await listRes.text();
    console.log('Status:', listRes.status);
    
    // Parse calendar URLs
    const calendars = [];
    const hrefMatches = listText.matchAll(/<D:href>([^<]+)<\/D:href>/g);
    const nameMatches = listText.matchAll(/<D:displayname>([^<]*)<\/D:displayname>/g);
    
    const hrefs = [...hrefMatches].map(m => m[1]);
    const names = [...nameMatches].map(m => m[1] || 'Unnamed');
    
    console.log('\n📂 Found calendars:');
    hrefs.forEach((href, i) => {
        if (href.includes('/calendar/') || href.endsWith('/')) {
            const name = names[i] || 'Default';
            console.log(`  - ${name}: ${href}`);
            calendars.push({ name, href });
        }
    });
    
    // Fetch events from each calendar
    for (const cal of calendars.slice(0, 3)) {
        console.log(`\n📆 Fetching events from: ${cal.name}`);
        
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
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
                      end="${nextWeek.toISOString().replace(/[-:]/g, '').split('.')[0]}Z"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
        
        const calUrl = cal.href.startsWith('http') ? cal.href : 'https://caldav.fastmail.com' + cal.href;
        const res = await makeRequest(calUrl, 'REPORT', body, '1');
        const text = await res.text();
        
        if (text.includes('VEVENT')) {
            console.log('  ✅ Events found!');
            // Extract basic event info
            const summaries = text.match(/SUMMARY:[^\r\n]+/g) || [];
            const starts = text.match(/DTSTART[^\r\n]+/g) || [];
            summaries.forEach((sum, i) => {
                console.log(`    - ${sum.replace('SUMMARY:', '')}`);
                if (starts[i]) console.log(`      ${starts[i]}`);
            });
        } else {
            console.log('  📭 No events in next 7 days');
        }
    }
}

main().catch(console.error);
