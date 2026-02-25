#!/usr/bin/env node
const Imap = require('/data/workspace/skills/fastmail-reader/node_modules/imap');
const { simpleParser } = require('/data/workspace/skills/fastmail-reader/node_modules/mailparser');

const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true
};

async function main() {
    return new Promise((resolve, reject) => {
        const imap = new Imap(config);
        
        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) return reject(err);
                
                // Fetch email #17
                const fetch = imap.seq.fetch('17', { bodies: '' });
                
                fetch.on('message', (msg, seqno) => {
                    let body = '';
                    msg.on('body', (stream) => {
                        stream.on('data', chunk => body += chunk);
                    });
                    
                    msg.once('end', async () => {
                        const parsed = await simpleParser(body);
                        console.log('📧 EMAIL #17\n');
                        console.log('From:', parsed.from?.text);
                        console.log('Subject:', parsed.subject);
                        console.log('Date:', parsed.date);
                        console.log('\n📋 BODY:\n');
                        console.log(parsed.text || parsed.html || '(no text)');
                        resolve();
                    });
                });
                
                fetch.once('end', () => imap.end());
            });
        });
        
        imap.once('error', reject);
        imap.connect();
    });
}

main().catch(console.error);
