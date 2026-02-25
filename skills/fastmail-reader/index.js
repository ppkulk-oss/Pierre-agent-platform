const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// Fastmail IMAP configuration
const config = {
    user: 'pierredugatpy@fastmail.com',
    password: '256q6t8p5w5t4t3p',
    host: 'imap.fastmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: true
    }
};

/**
 * Read latest emails and check for attachments
 * @returns {Promise<Array>} Array of email objects
 */
async function readEmails() {
    return new Promise((resolve, reject) => {
        const imap = new Imap(config);
        const emails = [];

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    imap.end();
                    reject(err);
                    return;
                }

                console.log(`Connected! Total messages: ${box.messages.total}`);

                if (box.messages.total === 0) {
                    console.log('Inbox is empty.');
                    imap.end();
                    resolve([]);
                    return;
                }

                // Get last 5 emails
                const start = Math.max(1, box.messages.total - 4);
                const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
                    bodies: ['HEADER.FIELDS (SUBJECT FROM DATE)', 'TEXT'],
                    struct: true
                });

                fetch.on('message', (msg, seqno) => {
                    const email = {
                        seq: seqno,
                        subject: '',
                        from: '',
                        date: null,
                        hasAttachments: false,
                        attachments: []
                    };

                    msg.on('body', (stream, info) => {
                        let buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', () => {
                            if (info.which.includes('HEADER')) {
                                const headers = Imap.parseHeader(buffer);
                                email.subject = headers.subject?.[0] || 'No subject';
                                email.from = headers.from?.[0] || 'Unknown';
                                email.date = headers.date?.[0] || null;
                            } else {
                                email.body = buffer;
                            }
                        });
                    });

                    msg.once('attributes', (attrs) => {
                        // Check for attachments
                        const struct = attrs.struct;
                        if (struct) {
                            const attachments = [];
                            function findAttachments(parts, prefix = '') {
                                parts.forEach((part, i) => {
                                    if (Array.isArray(part)) {
                                        findAttachments(part, `${prefix}${i}.`);
                                    } else if (part.disposition && ['INLINE', 'ATTACHMENT'].includes(part.disposition.type)) {
                                        attachments.push({
                                            filename: part.disposition.params?.filename || `attachment-${prefix}${i}`,
                                            type: part.type,
                                            subtype: part.subtype
                                        });
                                    }
                                });
                            }
                            findAttachments(struct);
                            email.hasAttachments = attachments.length > 0;
                            email.attachments = attachments;
                        }
                    });

                    msg.once('end', () => {
                        emails.push(email);
                    });
                });

                fetch.once('error', (err) => {
                    reject(err);
                });

                fetch.once('end', () => {
                    console.log(`Fetched ${emails.length} emails`);
                    imap.end();
                    resolve(emails);
                });
            });
        });

        imap.once('error', (err) => {
            reject(err);
        });

        imap.connect();
    });
}

// CLI entry point
if (require.main === module) {
    readEmails()
        .then(emails => {
            if (emails.length === 0) {
                console.log('Ready for the schedule');
            } else {
                console.log('\n=== LATEST EMAIL ===');
                const latest = emails[emails.length - 1];
                console.log(`Subject: ${latest.subject}`);
                console.log(`From: ${latest.from}`);
                console.log(`Date: ${latest.date}`);
                console.log(`Has Attachments: ${latest.hasAttachments}`);
                if (latest.hasAttachments) {
                    console.log('Attachments:', latest.attachments.map(a => a.filename).join(', '));
                }
            }
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

module.exports = { readEmails };
