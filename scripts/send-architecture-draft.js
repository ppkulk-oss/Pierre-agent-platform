const Imap = require('imap');
const fs = require('fs');

const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true
};

// Read the architecture files
const summary = fs.readFileSync('/data/workspace/memory/architecture-shareable-summary.md', 'utf-8');
const review = fs.readFileSync('/data/workspace/memory/architecture-review-devops.md', 'utf-8');

function createDraftEmail(to, subject, text) {
    const date = new Date().toUTCString();
    const messageId = `${Date.now()}@pierre`;
    
    const lines = [
        `Message-Id: <${messageId}>`,
        `Date: ${date}`,
        `From: Pierre <pierredugatpy@fastmail.com>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        '',
        text
    ];
    
    return lines.join('\r\n');
}

function appendDraft(to, subject, text) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(config);
        const message = createDraftEmail(to, subject, text);
        
        console.log('Connecting to IMAP...');
        
        imap.once('ready', () => {
            console.log('IMAP connected, opening Drafts...');
            
            imap.openBox('Drafts', false, (err) => {
                if (err) {
                    imap.end();
                    reject(err);
                    return;
                }
                
                console.log('Drafts folder open, appending message...');
                
                const msgBuffer = Buffer.from(message);
                imap.append(msgBuffer, { mailbox: 'Drafts' }, (err) => {
                    imap.end();
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: true, subject });
                    }
                });
            });
        });
        
        imap.once('error', (err) => {
            reject(err);
        });
        
        imap.connect();
    });
}

const subject = 'Architecture Review Request - Multi-Agent Platform';

const body = `Hi,

I'm working on a personal project - a multi-agent AI platform to help manage various aspects of my life (travel planning, wine allocations, calendar, finance, etc.). Think of it as specialized AI agents that collaborate on tasks.

I've put together an architecture proposal and would love your professional opinion before I start building. See below for two documents:

1. ARCHITECTURE SUMMARY (High-level proposal)
2. DEVOPS REVIEW (Critical review with concerns)

SPECIFIC QUESTIONS:
- Is the Railway + Supabase split worth the complexity, or is a single VPS the smarter play?
- The Redis Pub/Sub concern seems valid - should I just use direct function calls between agents?
- Am I over-engineering this for a personal system?

CONTEXT:
This is a hobby project running on a Railway hobby plan. I want something impressive enough to "boast to any asshole nerd" (my words) but I also don't want to spend weekends debugging distributed systems.

Current agents in the fleet:
- Allemand (wine allocation hunter)
- Odyssey (travel planning - just built a Japan trip dashboard)
- Future: Finance agent, Calendar agent

Any feedback appreciated - no need for a novel, just gut reactions and red flags.

Thanks!
Prashant

---

ATTACHMENT 1: ARCHITECTURE SHAREABLE SUMMARY
===========================================

${summary}

---

ATTACHMENT 2: DEVOPS ARCHITECTURE REVIEW
========================================

${review}
`;

console.log('Creating draft via IMAP APPEND...\n');

appendDraft('prashant@prashantkulkarni.org', subject, body)
    .then(result => {
        console.log('\n✅ Success!');
        console.log('Draft created:', result.subject);
        console.log('Check your Fastmail Drafts folder.');
    })
    .catch(err => {
        console.error('\n❌ Failed:', err.message);
        process.exit(1);
    });
