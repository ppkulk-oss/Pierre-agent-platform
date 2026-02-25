#!/usr/bin/env node
/**
 * On-Call Alert System
 * Checks calendar for on-call shifts and generates reminders
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
  <D:prop>
    <C:calendar-data/>
  </D:prop>
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
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/xml; charset=utf-8',
            'Depth': '1'
        },
        body
    });
    
    const text = await res.text();
    if (!text.includes('VEVENT')) return [];
    
    // Parse events
    const events = [];
    const eventBlocks = text.split('BEGIN:VEVENT').slice(1);
    
    for (const block of eventBlocks) {
        const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
        const startMatch = block.match(/DTSTART(?:;[^\r\n]+)?:([^\r\n]+)/);
        const endMatch = block.match(/DTEND(?:;[^\r\n]+)?:([^\r\n]+)/);
        
        if (summaryMatch && startMatch) {
            // Parse date
            const dateStr = startMatch[1];
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const date = new Date(`${year}-${month}-${day}`);
            
            events.push({
                summary: summaryMatch[1].replace(/\\,/g, ','),
                date: date,
                dateStr: `${year}-${month}-${day}`
            });
        }
    }
    
    return events.sort((a, b) => a.date - b.date);
}

function formatDate(date) {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function main() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    // Check tomorrow
    const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEvents = await fetchEvents(tomorrow, tomorrowEnd);
    
    // Check next 2 weeks
    const upcomingEvents = await fetchEvents(now, nextWeekEnd);
    
    console.log('📅 ON-CALL ALERT SYSTEM\n');
    console.log('=' .repeat(40));
    
    // Tomorrow alert
    if (tomorrowEvents.length > 0) {
        console.log('\n🚨 TOMORROW ALERT:\n');
        for (const evt of tomorrowEvents) {
            console.log(`📌 ${formatDate(evt.date)}`);
            console.log(`   ${evt.summary}`);
            console.log('');
        }
    } else {
        console.log('\n✅ No on-call shift tomorrow');
    }
    
    // Upcoming schedule
    const onCallEvents = upcomingEvents.filter(e => 
        e.summary.toLowerCase().includes('on-call') || 
        e.summary.toLowerCase().includes('ob')
    );
    
    if (onCallEvents.length > 0) {
        console.log('\n📆 UPCOMING ON-CALL SHIFTS:\n');
        for (const evt of onCallEvents) {
            const daysUntil = Math.ceil((evt.date - now) / (1000 * 60 * 60 * 24));
            const daysText = daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `in ${daysUntil} days`;
            console.log(`📌 ${formatDate(evt.date)} (${daysText})`);
            console.log(`   ${evt.summary}`);
            console.log('');
        }
    }
    
    // Summary for cron
    if (tomorrowEvents.length > 0) {
        console.log('\n🎯 ACTION NEEDED: Alert user about tomorrow\'s shift');
        process.exit(1); // Signal to cron that alert needed
    } else {
        console.log('\n✅ No alerts needed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
