#!/usr/bin/env node
const Imap = require('/data/workspace/skills/fastmail-reader/node_modules/imap');
const { simpleParser } = require('/data/workspace/skills/fastmail-reader/node_modules/mailparser');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: true }
};

async function main() {
  console.log('📧 Fetching email #7 (Schedule with attachment)...\n');
  
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) return reject(err);
        
        // Fetch email #7 specifically
        const fetch = imap.seq.fetch('7', {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          console.log(`Processing message #${seqno}`);
          
          let bodyBuffer = '';
          const attachments = [];
          
          msg.on('body', (stream, info) => {
            stream.on('data', chunk => bodyBuffer += chunk);
          });

          msg.once('attributes', (attrs) => {
            console.log('Parsing MIME structure...');
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(bodyBuffer);
              
              console.log(`Subject: ${parsed.subject}`);
              console.log(`From: ${parsed.from?.text}`);
              console.log(`Date: ${parsed.date}`);
              console.log(`\nAttachments found: ${parsed.attachments?.length || 0}`);
              
              if (parsed.attachments && parsed.attachments.length > 0) {
                for (const att of parsed.attachments) {
                  console.log(`\n  - ${att.filename} (${att.contentType})`);
                  
                  // Save attachment
                  const attPath = `/data/workspace/downloads/${att.filename}`;
                  fs.mkdirSync('/data/workspace/downloads', { recursive: true });
                  fs.writeFileSync(attPath, att.content);
                  console.log(`  Saved to: ${attPath}`);
                  
                  // If it's Excel, try to read it
                  if (att.filename.endsWith('.xlsx') || att.filename.endsWith('.xls')) {
                    console.log('\n📊 Excel file detected - attempting to parse...');
                    try {
                      const XLSX = require('/data/workspace/skills/fastmail-reader/node_modules/xlsx');
                      const workbook = XLSX.readFile(attPath);
                      const sheetName = workbook.SheetNames[0];
                      const sheet = workbook.Sheets[sheetName];
                      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                      
                      console.log('\n=== EXCEL CONTENT (first 20 rows) ===');
                      data.slice(0, 20).forEach((row, i) => {
                        console.log(`Row ${i+1}: ${row.join(' | ')}`);
                      });
                      
                      // Save parsed data
                      fs.writeFileSync('/data/workspace/downloads/schedule-parsed.json', JSON.stringify(data, null, 2));
                      console.log('\n✅ Full data saved to: /data/workspace/downloads/schedule-parsed.json');
                    } catch (e) {
                      console.log(`  Error parsing Excel: ${e.message}`);
                      console.log('  (xlsx module may not be installed)');
                    }
                  }
                }
              }
              
              // Also show text content
              if (parsed.text) {
                console.log('\n=== EMAIL TEXT ===');
                console.log(parsed.text.substring(0, 500));
              }
              
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });

        fetch.once('error', reject);
        fetch.once('end', () => {
          // Connection ends after message processing
        });
      });
    });
    
    imap.once('error', reject);
    imap.once('end', () => console.log('\n✅ Done'));
    imap.connect();
  });
}

main().catch(e => console.error('Error:', e.message));
