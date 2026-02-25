const https = require('https');

// Fastmail JMAP configuration
const JMAP_ENDPOINT = 'https://api.fastmail.com/jmap/session';
const USER = 'pierredugatpy@fastmail.com';
const PASS = '256q6t8p5w5t4t3p';

/**
 * Get JMAP session and account info
 */
async function getJmapSession() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');
        
        const options = {
            hostname: 'api.fastmail.com',
            path: '/jmap/session',
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const session = JSON.parse(data);
                    resolve(session);
                } catch (e) {
                    reject(new Error('Failed to parse JMAP session: ' + e.message));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Add calendar events using JMAP
 * @param {Array} events - Array of event objects
 */
async function addCalendarEvents(events) {
    try {
        // Get session
        const session = await getJmapSession();
        console.log('JMAP Session acquired');
        console.log('Primary account:', session.primaryAccounts?.['urn:ietf:params:jmap:calendars']);

        // For now, just log what we would create
        console.log(`\nWould create ${events.length} events:`);
        events.forEach((event, i) => {
            console.log(`${i + 1}. ${event.title}`);
            console.log(`   Start: ${event.start}`);
            console.log(`   End: ${event.end}`);
            if (event.description) console.log(`   Desc: ${event.description}`);
        });

        return { success: true, count: events.length };
    } catch (error) {
        console.error('JMAP Error:', error.message);
        throw error;
    }
}

// CLI entry point
if (require.main === module) {
    // Test with sample events
    const testEvents = [
        {
            title: 'Japan Trip - Departure',
            start: '2026-03-31T11:25:00',
            end: '2026-03-31T15:00:00',
            description: 'Flight UA 79 to Tokyo'
        }
    ];

    addCalendarEvents(testEvents)
        .then(result => {
            console.log('\n✅ Calendar tool ready');
        })
        .catch(err => {
            console.error('Failed:', err.message);
            process.exit(1);
        });
}

module.exports = { addCalendarEvents, getJmapSession };
