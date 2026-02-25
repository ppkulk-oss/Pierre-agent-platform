const https = require('https');
const xml2js = require('xml2js');

// Fastmail CalDAV configuration
const config = {
    hostname: 'caldav.fastmail.com',
    user: 'pierredugatpy@fastmail.com',
    pass: '256q6t8p5w5t4t3p'
};

/**
 * Make authenticated CalDAV request
 */
function makeRequest(path, method, body = null, depth = '0') {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${config.user}:${config.pass}`).toString('base64');
        
        const options = {
            hostname: config.hostname,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'text/xml; charset=utf-8',
                'Depth': depth,
                'Accept': 'text/xml'
            }
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data
                });
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

/**
 * List calendars (simplified - discovers principal URL first)
 */
async function listCalendars() {
    try {
        console.log('Connecting to Fastmail CalDAV...\n');
        
        // Step 1: Get current-user-principal from well-known CalDAV endpoint
        const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`;

        // Try standard CalDAV paths
        const paths = ['/dav/', '/.well-known/caldav', '/'];
        let principalRes;
        
        for (const path of paths) {
            try {
                principalRes = await makeRequest(path, 'PROPFIND', propfindBody, '0');
                if (principalRes.status === 207 || principalRes.status === 301 || principalRes.status === 302) {
                    console.log(`Found CalDAV at path: ${path}`);
                    break;
                }
            } catch (e) {
                // Try next path
            }
        }
        
        if (!principalRes) {
            principalRes = await makeRequest('/dav/', 'PROPFIND', propfindBody, '0');
        }
        console.log('Principal lookup status:', principalRes.status);
        
        if (principalRes.status === 207) {
            console.log('✅ Authentication successful');
            
            // Parse to find principal URL
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(principalRes.data);
            
            // Extract principal URL
            const responses = result['d:multistatus']?.['d:response'];
            if (responses && responses[0]) {
                const propstat = responses[0]['d:propstat']?.[0];
                const prop = propstat?.['d:prop']?.[0];
                const principal = prop?.['d:current-user-principal']?.[0]?.['d:href']?.[0];
                
                console.log('Principal:', principal);
                
                // Step 2: Get calendar-home-set from principal
                const homeSetBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set/>
  </d:prop>
</d:propfind>`;

                const homeRes = await makeRequest(principal, 'PROPFIND', homeSetBody, '0');
                
                if (homeRes.status === 207) {
                    const homeResult = await parser.parseStringPromise(homeRes.data);
                    const homeResponses = homeResult['d:multistatus']?.['d:response'];
                    
                    if (homeResponses && homeResponses[0]) {
                        const homeProp = homeResponses[0]['d:propstat']?.[0]?.['d:prop']?.[0];
                        const calendarHome = homeProp?.['c:calendar-home-set']?.[0]?.['d:href']?.[0];
                        
                        console.log('Calendar home:', calendarHome);
                        
                        // Step 3: List calendars in home
                        const calendarListBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname/>
    <c:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`;

                        const listRes = await makeRequest(calendarHome, 'PROPFIND', calendarListBody, '1');
                        
                        if (listRes.status === 207) {
                            const listResult = await parser.parseStringPromise(listRes.data);
                            const calendars = listResult['d:multistatus']?.['d:response'] || [];
                            
                            console.log('\n=== CALENDARS FOUND ===');
                            let count = 0;
                            calendars.forEach((cal, i) => {
                                const href = cal['d:href']?.[0];
                                const displayName = cal['d:propstat']?.[0]?.['d:prop']?.[0]?.['d:displayname']?.[0];
                                
                                // Skip the home directory itself
                                if (href && href !== calendarHome && displayName) {
                                    count++;
                                    console.log(`${count}. ${displayName}`);
                                    console.log(`   Path: ${href}`);
                                }
                            });
                            
                            if (count === 0) {
                                console.log('No calendars found in home set.');
                            }
                            
                            return calendars;
                        }
                    }
                }
            }
        } else {
            console.error('❌ Authentication failed');
            console.log('Response:', principalRes.data);
        }
        
        return [];
    } catch (error) {
        console.error('CalDAV Error:', error.message);
        throw error;
    }
}

// CLI entry point
if (require.main === module) {
    listCalendars()
        .then(() => {
            console.log('\n✅ CalDAV connection working');
            console.log('Ready for Excel file import');
        })
        .catch(err => {
            console.error('Failed:', err.message);
            process.exit(1);
        });
}

module.exports = { listCalendars, makeRequest };
