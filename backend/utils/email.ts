import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

// Helper to send email via Brevo API (HTTPS Port 443 - Firewall Friendly)
const sendViaBrevo = (to: string, subject: string, html: string, text?: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const apiKey = process.env.BREVO_API_KEY;
        // Fallback to the user-provided email as sender
        const senderEmail = process.env.EMAIL_USER || "a26516001@smtp-brevo.com";

        if (!apiKey) {
            console.error('[Brevo] Missing BREVO_API_KEY environment variable');
            resolve(false);
            return;
        }

        const data = JSON.stringify({
            sender: {
                name: "Secure Wallet",
                email: senderEmail
            },
            to: [
                {
                    email: to
                }
            ],
            subject: subject,
            htmlContent: html,
            textContent: text || html.replace(/<[^>]*>?/gm, '') // Strip tags for text version
        });

        const options = {
            hostname: 'api.brevo.com',
            port: 443,
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => body += chunk);

            res.on('end', () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log(`[Brevo] Email sent to ${to}. Response: ${body}`);
                    resolve(true);
                } else {
                    console.error(`[Brevo] Failed to send to ${to}. Status: ${res.statusCode}. Response: ${body}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('[Brevo] Network Error:', error);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
};

export const sendOTP = async (email: string, otp: string) => {
    return sendViaBrevo(
        email,
        'Your Wallet Verification Code',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>Verification Code</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #000; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
        </div>
        `,
        `Your verification code is: ${otp}`
    );
};

export const sendWelcomeEmail = async (email: string, username: string) => {
    return sendViaBrevo(
        email,
        'Welcome to Your Wallet!',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome, ${username}!</h2>
            <p>Thank you for joining our secure wallet platform.</p>
            <p>You can now manage your cards, secure your app with a PIN, and more.</p>
        </div>
        `
    );
};

export const sendSecurityAlert = async (email: string, type: 'PIN_SET' | 'PIN_CHANGED' | 'PIN_REMOVED') => {
    const messages = {
        'PIN_SET': 'A new App Lock PIN has been set for your account.',
        'PIN_CHANGED': 'Your App Lock PIN was recently changed.',
        'PIN_REMOVED': 'Your App Lock PIN has been removed.'
    };

    return sendViaBrevo(
        email,
        'Security Alert: Wallet App',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d9534f;">Security Alert</h2>
            <p>${messages[type]}</p>
            <p>If you did not execute this action, please contact support immediately.</p>
        </div>
        `
    );
};

export const sendManagerInvite = async (email: string, otp: string) => {
    return sendViaBrevo(
        email,
        'You have been invited to be a Manager',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Manager Invitation</h2>
            <p>You have been invited to manage the SecureWallet platform.</p>
            <p>To set up your account, please use the following verification code:</p>
            <h1 style="color: #6d28d9; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
            <p>This code will expire in 24 hours.</p>
            <div style="margin: 30px 0;">
                <a href="${process.env.APP_URL}/manager-setup" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Setup Manager Account</a>
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
    );
};

export const sendManagerSuccess = async (email: string, username: string) => {
    return sendViaBrevo(
        email,
        'Manager Account Setup Complete',
        `
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
    );
};

// Generic send for debug
export const sendDebugEmail = sendViaBrevo;
