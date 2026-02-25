const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Gmail IMAP configuration
const config = {
    user: process.env.GMAIL_USER || 'pierredugatpy@gmail.com',
    password: 'rkmvteansopwjnrz', // No spaces
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
};

/**
 * Read the most recent email from Gmail inbox with full body
 * @returns {Promise<Object>} Email with subject, from, date, body
 */
async function readLatestEmail() {
    return new Promise((resolve, reject) => {
        const imap = new Imap(config);

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    imap.end();
                    reject(err);
                    return;
                }

                // Search for emails with 'ticket' in subject
                imap.search(['UNSEEN', ['SUBJECT', 'ticket']], (err, results) => {
                    if (err || !results || results.length === 0) {
                        // Fallback: get recent emails
                        fetchRecent(imap, box, resolve, reject);
                        return;
                    }
                    fetchEmails(imap, results, resolve, reject);
                });
                return;

                let emailData = {
                    subject: 'No subject',
                    from: 'Unknown',
                    date: null,
                    body: ''
                };

                fetch.on('message', (msg) => {
                    msg.on('body', (stream, info) => {
                        let buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', async () => {
                            if (info.which === 'HEADER.FIELDS (SUBJECT FROM DATE)') {
                                const headers = Imap.parseHeader(buffer);
                                emailData.subject = headers.subject?.[0] || 'No subject';
                                emailData.from = headers.from?.[0] || 'Unknown';
                                emailData.date = headers.date?.[0] || null;
                            } else {
                                // This is the body
                                emailData.body = buffer;
                            }
                        });
                    });

                    msg.once('end', () => {
                        resolve(emailData);
                    });
                });

                fetch.once('error', (err) => {
                    reject(err);
                });

                fetch.once('end', () => {
                    imap.end();
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
    readLatestEmail()
        .then(email => {
            console.log(JSON.stringify(email, null, 2));
        })
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

module.exports = { readLatestEmail };
