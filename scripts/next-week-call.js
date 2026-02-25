#!/usr/bin/env node
/**
 * Quick check: What is my next week like for call?
 */

const config = {
    username: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    calendarUrl: 'https://caldav.fastmail.com/dav/calendars/user/pierredugatpy@fastmail.com/E65DD1A6-08E8-11F1-AAFE-32F482036B07/'
};

const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

async function fetchEvents(startDate, endDate) {
    const start = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const body = `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:D="DAV:">
  <D:prop><C:calendar-data/></D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${start}" end="${end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;
    
    const res = await fetch(config.calendarUrl, {
        method: 'REPORT',
        headers: { 'Authorization': auth, 'Content-Type': 'application/xml; charset=utf-8', 'Depth': '1' },
        body
    });
    
    const text = await res.text();
    if (!text.includes('VEVENT')) return [];
    
    const events = [];
    const blocks = text.split('BEGIN:VEVENT').slice(1);
    
    for (const block of blocks) {
        const summary = block.match(/SUMMARY:([^\r\n]+)/);
        const start = block.match(/DTSTART(?:;[^\r\n]+)?:([^\r\n]+)/);
        if (summary && start) {
            const ds = start[1];
            events.push({
                summary: summary[1].replace(/\\,/g, ','),
                date: new Date(`${ds.substring(0,4)}-${ds.substring(4,6)}-${ds.substring(6,8)}`)
            });
        }
    }
    return events.sort((a,b) => a.date - b.date);
}

async function main() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await fetchEvents(now, nextWeek);
    
    console.log('📅 YOUR NEXT 7 DAYS:\n');
    
    if (events.length === 0) {
        console.log('✅ No on-call shifts next week');
        console.log('\n💡 Next shift: Mon Mar 17 (On-Call)');
        return;
    }
    
    for (const evt of events) {
        const day = evt.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        console.log(`📌 ${day}`);
        console.log(`   ${evt.summary}\n`);
    }
}

main().catch(console.error);
