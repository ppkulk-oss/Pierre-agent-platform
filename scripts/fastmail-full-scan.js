#!/usr/bin/env node
const Imap = require('/data/workspace/skills/fastmail-reader/node_modules/imap');
const fs = require('fs');

const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: true }
};

async function main() {
  console.log('🔍 FULL INBOX SCAN - looking for ppkulk@gmail.com or Feb 13 or "schedule"...\n');
  
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) return reject(err);
        
        console.log(`Total messages in INBOX: ${box.messages.total}\n`);
        
        if (box.messages.total === 0) {
          console.log('Inbox is empty.');
          imap.end();
          resolve();
          return;
        }

        // Fetch ALL emails
        const fetch = imap.seq.fetch('1:*', {
          bodies: 'HEADER.FIELDS (SUBJECT FROM DATE TO)',
          struct: true
        });

        const emails = [];
        
        fetch.on('message', (msg, seqno) => {
          const email = { seqno, subject: '', from: '', to: '', date: '', hasAttachments: false };
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString('utf8'));
            stream.once('end', () => {
              if (info.which.includes('HEADER')) {
                const headers = Imap.parseHeader(buffer);
                email.subject = headers.subject?.[0] || '(no subject)';
                email.from = headers.from?.[0] || '(unknown)';
                email.to = headers.to?.[0] || '';
                email.date = headers.date?.[0] || '';
              }
            });
          });

          msg.once('attributes', (attrs) => {
            const struct = attrs.struct;
            if (struct) {
              function findAttachments(parts) {
                parts.forEach(part => {
                  if (Array.isArray(part)) {
                    findAttachments(part);
                  } else if (part.disposition && ['INLINE', 'ATTACHMENT'].includes(part.disposition.type)) {
                    email.hasAttachments = true;
                  }
                });
              }
              findAttachments(struct);
            }
          });

          msg.once('end', () => {
            emails.push(email);
          });
        });

        fetch.once('error', reject);
        
        fetch.once('end', () => {
          console.log(`Fetched ${emails.length} total emails\n`);
          
          // Look for ppkulk@gmail.com
          const fromGmail = emails.filter(e => e.from.toLowerCase().includes('ppkulk@gmail.com'));
          console.log(`=== Emails FROM ppkulk@gmail.com: ${fromGmail.length} ===`);
          fromGmail.forEach(e => {
            console.log(`[${e.seqno}] ${e.date}`);
            console.log(`    Subject: ${e.subject}`);
            console.log(`    Has Attachments: ${e.hasAttachments}`);
            console.log('---');
          });
          
          // Look for Feb 13
          const feb13 = emails.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === 1 && d.getDate() === 13 && d.getFullYear() === 2026;
          });
          console.log(`\n=== Emails from Feb 13, 2026: ${feb13.length} ===`);
          feb13.forEach(e => {
            console.log(`[${e.seqno}] From: ${e.from}`);
            console.log(`    Subject: ${e.subject}`);
            console.log(`    Has Attachments: ${e.hasAttachments}`);
            console.log('---');
          });
          
          // Look for "schedule" in subject
          const scheduleEmails = emails.filter(e => e.subject.toLowerCase().includes('schedule'));
          console.log(`\n=== Emails with "schedule" in subject: ${scheduleEmails.length} ===`);
          scheduleEmails.forEach(e => {
            console.log(`[${e.seqno}] ${e.date}`);
            console.log(`    From: ${e.from}`);
            console.log(`    Subject: ${e.subject}`);
            console.log(`    Has Attachments: ${e.hasAttachments}`);
            console.log('---');
          });
          
          // All emails with attachments
          const withAtts = emails.filter(e => e.hasAttachments);
          console.log(`\n=== All emails with attachments: ${withAtts.length} ===`);
          withAtts.forEach(e => {
            console.log(`[${e.seqno}] ${e.date}`);
            console.log(`    From: ${e.from}`);
            console.log(`    Subject: ${e.subject}`);
            console.log('---');
          });
          
          imap.end();
          resolve();
        });
      });
    });
    
    imap.once('error', reject);
    imap.connect();
  });
}

main().catch(e => console.error('Error:', e.message));
