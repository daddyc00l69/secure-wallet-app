import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using the default SMTP transport
let transporter: nodemailer.Transporter;

const createTransporter = () => {
    // configured for Brevo (Sendinblue)
    return nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587, // Standard submission port
        secure: false, // true for 465, false for other ports
        auth: {
            user: "a26516001@smtp-brevo.com", // User provided
            pass: "gDf9RCyOa4GHZ37v", // User provided
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        },
        // Force IPv4 if needed, but usually Brevo handles this well.
        // We can add family: 4 if we see DNS issues.
    });
};

// Initialize
transporter = createTransporter();

// Helper to check connection
export const checkSMTPConnection = async () => {
    try {
        await transporter.verify();
        console.log('[Email] Brevo SMTP connection verified');
        return true;
    } catch (error) {
        console.error('[Email] Brevo SMTP connection failed:', error);
        return false;
    }
};

export const sendOTP = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>', // Must match authenticated user or verified sender
            to: email,
            subject: 'Your Wallet Verification Code',
            text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Verification Code</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #000; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendWelcomeEmail = async (email: string, username: string) => {
    try {
        const mailOptions = {
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>',
            to: email,
            subject: 'Welcome to Your Wallet!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome, ${username}!</h2>
                    <p>Thank you for joining our secure wallet platform.</p>
                    <p>You can now manage your cards, secure your app with a PIN, and more.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

export const sendSecurityAlert = async (email: string, type: 'PIN_SET' | 'PIN_CHANGED' | 'PIN_REMOVED') => {
    const messages = {
        'PIN_SET': 'A new App Lock PIN has been set for your account.',
        'PIN_CHANGED': 'Your App Lock PIN was recently changed.',
        'PIN_REMOVED': 'Your App Lock PIN has been removed.'
    };

    try {
        const mailOptions = {
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>',
            to: email,
            subject: 'Security Alert: Wallet App',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d9534f;">Security Alert</h2>
                    <p>${messages[type]}</p>
                    <p>If you did not execute this action, please contact support immediately.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending security email:', error);
        return false;
    }
};

export const sendManagerInvite = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>',
            to: email,
            subject: 'You have been invited to be a Manager',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Manager Invitation</h2>
                    <p>You have been invited to manage the SecureWallet platform.</p>
                    <p>To set up your account, please use the following verification code:</p>
                    <h1 style="color: #6d28d9; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
                    <p>This code will expire in 24 hours.</p>
                    <div style="margin: 30px 0;">
                        <a href="http://localhost:5173/manager-setup" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Setup Manager Account</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        <strong>Terms & Conditions:</strong><br>
                        By accepting this invitation, you agree to maintain the confidentiality of all user data.
                        Unauthorized access or sharing of sensitive information will result in immediate termination
                        and potential legal action. You agree to adhere to all platform security protocols.
                    </p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending invite email:', error);
        return false;
    }
};

export const sendManagerSuccess = async (email: string, username: string) => {
    try {
        const mailOptions = {
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>',
            to: email,
            subject: 'Manager Account Setup Complete',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #10b981;">Setup Complete!</h2>
                    <p>Hello ${username},</p>
                    <p>Your manager account has been successfully set up and verified.</p>
                    <p>You can now log in to the Manager Dashboard.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">
                        <strong>Privacy Policy:</strong><br>
                        We respect the privacy of all our users and managers. Your data is stored securely.
                        As a manager, you are entrusted with limited access to user data for support purposes only.
                        Data misuse is strictly prohibited.
                    </p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending success email:', error);
        return false;
    }
};

// Generic send for debug
export const sendDebugEmail = async (to: string, subject: string, html: string, text?: string) => {
    try {
        await transporter.sendMail({
            from: '"Secure Wallet" <a26516001@smtp-brevo.com>',
            to,
            subject,
            html,
            text
        });
        return true;
    } catch (e) {
        console.error("Brevo Send Error:", e);
        return false;
    }
};
