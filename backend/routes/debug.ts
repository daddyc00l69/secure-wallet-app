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

export default router;
