import express from 'express';
import https from 'https';
import { sendDebugEmail } from '../utils/email';

const router = express.Router();

const checkHttp = (url: string, timeout = 5000): Promise<string> => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res: any) => {
            if (res.statusCode === 200) {
                resolve('OK');
            } else {
                reject(new Error(`HTTP Status: ${res.statusCode}`));
            }
        });

        req.on('error', (err: any) => {
            reject(err);
        });

        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Timeout (${timeout}ms)`));
        });
    });
};

router.get('/email', async (req, res) => {
    const targetEmail = req.query.to as string;

    if (!targetEmail) {
        res.status(400).json({ message: 'Missing "to" query parameter' });
        return;
    }

    const results: any = {
        checks: [],
        emailSent: false,
        error: null
    };

    try {
        // 1. Check Internet Access (HTTP)
        try {
            await checkHttp('https://www.google.com');
            results.checks.push({ step: 'Internet Access (HTTP)', status: 'OK' });
        } catch (error) {
            results.checks.push({ step: 'Internet Access (HTTP)', status: 'FAILED', error: (error as Error).message });
        }

        // 2. Check Brevo API Key
        if (!process.env.BREVO_API_KEY) {
            results.checks.push({ step: 'BREVO_API_KEY', status: 'FAILED', error: 'Missing Environment Variable' });
            throw new Error('BREVO_API_KEY missing');
        }
        results.checks.push({ step: 'BREVO_API_KEY', status: 'OK' });

        // 3. Send Test Email via Brevo
        const success = await sendDebugEmail(
            targetEmail,
            'Brevo API Debug Test',
            '<strong>It works!</strong><br>If you are reading this, Brevo API is working via Port 443.',
            'It works! Brevo API is working.'
        );

        if (success) {
            results.emailSent = true;
            results.checks.push({ step: 'Send Email (Brevo)', status: 'OK' });
        } else {
            results.checks.push({ step: 'Send Email (Brevo)', status: 'FAILED', error: 'Check server logs for details' });
            throw new Error('Failed to send email via Brevo');
        }

        res.json(results);

    } catch (error) {
        results.error = (error as Error).message;
        res.status(500).json(results);
    }
});

// Temporary route to make a user an admin AND delete all others
router.get('/make-admin', async (req, res) => {
    const email = req.query.email as string;

    if (!email) {
        res.status(400).json({ message: 'Missing email query parameter' });
        return;
    }

    try {
        const User = (await import('../models/User')).default;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: `User not found: ${email}` });
            return;
        }

        // 1. Make Admin
        user.role = 'admin';
        await user.save();

        // 2. Delete ALL other users
        const result = await User.deleteMany({ _id: { $ne: user._id } });

        res.json({
            message: `Success! User ${email} is now the ONLY user and is an ADMIN.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Cleanup Users Route
router.get('/cleanup-users', async (req, res) => {
    try {
        const User = (await import('../models/User')).default;
        const bcrypt = await import('bcryptjs');

        const allowedEmails = ['tushar0p.verify+1@gmail.com', 'admin@test.app'];

        // 1. Delete everyone else
        const deleteResult = await User.deleteMany({
            email: { $nin: allowedEmails }
        });

        // 2. Upsert 'admin@test.app'
        let testAdmin = await User.findOne({ email: 'admin@test.app' });
        if (!testAdmin) {
            testAdmin = new User({
                username: 'Test Admin',
                email: 'admin@test.app',
                password: 'test123',
                role: 'admin',
                isVerified: true,
                appLockPin: await bcrypt.hash('1234', 10)
            });
        } else {
            testAdmin.role = 'admin';
            testAdmin.password = 'test123';
            testAdmin.isVerified = true;
        }
        await testAdmin.save();

        // 3. Ensure 'tushar0p.verify+1@gmail.com' is also admin if exists, or create?
        // User didn't specify password for tushar, assuming existing or default. 
        // I will just ensure it exists if it was deleted (unlikely due to filter) 
        // allows user to register it if not present, or I can Create it.
        // User said "keep 2 admin", implies they might already exist or need creation.
        // I'll create tushar if missing with same test password for access.
        let mainAdmin = await User.findOne({ email: 'tushar0p.verify+1@gmail.com' });
        if (!mainAdmin) {
            mainAdmin = new User({
                username: 'Main Admin',
                email: 'tushar0p.verify+1@gmail.com',
                password: 'test123', // Defaulting for access
                role: 'admin',
                isVerified: true,
                appLockPin: await bcrypt.hash('1234', 10)
            });
        } else {
            mainAdmin.role = 'admin';
            // Don't reset password for main admin if exists, just role.
        }
        await mainAdmin.save();

        res.json({
            message: 'Cleanup complete. Only 2 admins remain.',
            deletedCount: deleteResult.deletedCount,
            admins: allowedEmails
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
