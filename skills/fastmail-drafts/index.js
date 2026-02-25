const Imap = require('imap');

const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true
};

function createDraftEmail(to, subject, text) {
    const date = new Date().toUTCString();
    const messageId = `${Date.now()}@pierre`;
    
    // Build message with proper CRLF line endings
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
    
    // Join with CRLF
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
                
                // Append the message
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

// Test
console.log('Creating draft via IMAP APPEND...\n');

appendDraft(
    'prashant@prashantkulkarni.org',
    'Test Draft from Railway',
    'This is a test draft created via IMAP APPEND.\r\n\r\nIf you can read this, it worked!\r\n\r\n- Pierre'
).then(result => {
    console.log('\n✅ Success!');
    console.log('Draft created:', result.subject);
    console.log('Check your Fastmail Drafts folder.');
}).catch(err => {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
});
