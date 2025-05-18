const nodemailer = require('nodemailer');
const config = require('../config.json');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) { 
    try {
        // Create a transporter with the configured SMTP settings
    const transporter = nodemailer.createTransport(config.smtpOptions);
        
        // Verify the connection configuration
        await transporter.verify();
        
        // Send the email
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html
        });
        
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to prevent API failures when email fails
        // Just log it and continue
        return { success: false, error: error.message };
    }
}
