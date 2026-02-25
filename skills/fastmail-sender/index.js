const nodemailer = require('nodemailer');

// Fastmail SMTP configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.fastmail.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
        user: 'pierredugatpy@fastmail.com',
        pass: '256q6t8p5w5t4t3p'
    }
});

/**
 * Send email via Fastmail SMTP
 */
async function sendEmail(to, subject, text, attachments = []) {
    try {
        const info = await transporter.sendMail({
            from: 'Pierre <pierredugatpy@fastmail.com>',
            to: to,
            subject: subject,
            text: text,
            attachments: attachments
        });
        
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error.message);
        return { success: false, error: error.message };
    }
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'test') {
        // Send test email
        sendEmail(
            'prashant@prashantkulkarni.org',
            'SMTP Check',
            'This is a test email from Pierre.\n\nSMTP sending is now configured and working!\n\n- Pierre'
        ).then(result => {
            if (result.success) {
                console.log('\n✅ Test email sent to prashant@prashantkulkarni.org');
            } else {
                console.log('\n❌ Failed:', result.error);
                process.exit(1);
            }
        });
    } else {
        console.log('Usage: node index.js test');
        console.log('  test  - Send test email to verify SMTP');
    }
}

module.exports = { sendEmail };
