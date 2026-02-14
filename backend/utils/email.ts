import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';
import util from 'util';

dotenv.config();

const resolve4 = util.promisify(dns.resolve4);
let cachedTransporter: any = null;

export const getTransporter = async () => {
    if (cachedTransporter) return cachedTransporter;

    let host = 'smtp.gmail.com';
    try {
        const addresses = await resolve4('smtp.gmail.com');
        if (addresses && addresses.length > 0) {
            host = addresses[0];
            console.log(`[Email] Resolved smtp.gmail.com to IPv4: ${host}`);
        }
    } catch (err) {
        console.warn('[Email] DNS resolution failed, falling back to domain:', err);
    }

    cachedTransporter = nodemailer.createTransport({
        host: host,
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s+/g, '')
        },
        tls: {
            servername: 'smtp.gmail.com' // proper SNI for IP connection
            // REJECT_UNAUTHORIZED: true // Optional: keep true for security
        },
        localAddress: '0.0.0.0', // Force binding to IPv4 interface
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000
    } as any);

    return cachedTransporter;
};

// Kept for backward compatibility if needed, but should be removed or deprecated
// export const transporter = ... (removed)

export const sendOTP = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
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

        const transporter = await getTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendWelcomeEmail = async (email: string, username: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
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
        const transporter = await getTransporter();
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
            from: process.env.EMAIL_USER,
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
        const transporter = await getTransporter();
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
            from: process.env.EMAIL_USER,
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
        const transporter = await getTransporter();
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
            from: process.env.EMAIL_USER,
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
        const transporter = await getTransporter();
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending success email:', error);
        return false;
    }
};
