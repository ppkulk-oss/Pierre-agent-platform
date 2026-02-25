#!/usr/bin/env node
/**
 * Fastmail CalDAV Test - Raw fetch approach
 */

const config = {
    username: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p'
};

async function testCalDAV() {
    console.log('🔍 Testing Fastmail CalDAV access...\n');
    
    const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    try {
        // Step 1: Discover principal URL
        console.log('Step 1: Discovering principal...');
        const principalRes = await fetch('https://caldav.fastmail.com/.well-known/caldav', {
            method: 'PROPFIND',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/xml; charset=utf-8',
                'Depth': '0'
            },
            body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`
        });
        
        console.log('  Status:', principalRes.status);
        const principalText = await principalRes.text();
        
        if (principalRes.status === 401) {
            console.log('❌ Authentication failed - calendar access not granted with these creds');
            return;
        }
        
        if (principalRes.status === 207) {
            console.log('✅ Authentication successful!');
            console.log('  Response preview:', principalText.substring(0, 300));
            
            // Try to parse principal URL
            const match = principalText.match(/<[^>]*current-user-principal[^>]*>([^<]+)/);
            if (match) {
                console.log('\n  Principal found:', match[1]);
            }
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testCalDAV();
