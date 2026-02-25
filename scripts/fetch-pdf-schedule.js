#!/usr/bin/env node
const Imap = require('/data/workspace/skills/fastmail-reader/node_modules/imap');
const { simpleParser } = require('/data/workspace/skills/fastmail-reader/node_modules/mailparser');
const fs = require('fs');

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
                
                const fetch = imap.seq.fetch('19', { bodies: '', struct: true });
                
                fetch.on('message', (msg, seqno) => {
                    let body = '';
                    msg.on('body', (stream) => {
                        stream.on('data', chunk => body += chunk);
                    });
                    
                    msg.once('attributes', (attrs) => {
                        console.log('Attributes:', JSON.stringify(attrs.struct, null, 2).substring(0, 800));
                    });
                    
                    msg.once('end', async () => {
                        const parsed = await simpleParser(body);
                        console.log('\n📧 EMAIL #19');
                        console.log('Subject:', parsed.subject);
                        console.log('Attachments:', parsed.attachments?.length || 0);
                        
                        if (parsed.attachments && parsed.attachments.length > 0) {
                            for (const att of parsed.attachments) {
                                console.log('\n📎 Attachment:', att.filename, `(${att.contentType})`);
                                const outPath = `/data/workspace/downloads/${att.filename}`;
                                fs.writeFileSync(outPath, att.content);
                                console.log('Saved to:', outPath);
                            }
                        }
                        
                        console.log('\n📋 Text preview:');
                        console.log((parsed.text || '').substring(0, 500));
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
