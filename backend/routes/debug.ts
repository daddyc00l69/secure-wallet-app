import express from 'express';

import { getTransporter } from '../utils/email';

const router = express.Router();

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
        // 1. Verify connection configuration
        try {
            const transporter = await getTransporter();
            await transporter.verify();
            results.checks.push({ step: 'SMTP Connection', status: 'OK' });
        } catch (error) {
            results.checks.push({ step: 'SMTP Connection', status: 'FAILED', error: (error as Error).message });
            throw error; // Stop if connection fails
        }

        // 2. Send Test Email
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: targetEmail,
            subject: 'SMTP Debug Test',
            text: 'If you are reading this, SMTP is working correctly on Render!',
        });

        results.emailSent = true;
        results.messageId = info.messageId;
        results.response = info.response;
        results.checks.push({ step: 'Send Email', status: 'OK' });

        res.json(results);

    } catch (error) {
        results.error = (error as Error).message;
        results.stack = (error as Error).stack;
        res.status(500).json(results);
    }
});

export default router;
