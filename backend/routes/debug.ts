import express from 'express';
import net from 'net';
import { getTransporter } from '../utils/email';

const router = express.Router();

const checkConnection = (host: string, port: number, timeout = 5000): Promise<string> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timer = setTimeout(() => {
            socket.destroy();
            resolve(`Timeout (${timeout}ms)`);
        }, timeout);

        socket.on('connect', () => {
            clearTimeout(timer);
            socket.destroy();
            resolve('Connected');
        });

        socket.on('error', (err) => {
            clearTimeout(timer);
            resolve(`Error: ${err.message}`);
        });

        socket.connect(port, host);
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
        // 0. Raw Network Checks
        const tcp587 = await checkConnection('smtp.gmail.com', 587);
        results.checks.push({ step: 'TCP Connect Port 587', status: tcp587 === 'Connected' ? 'OK' : 'FAILED', error: tcp587 });

        const tcp465 = await checkConnection('smtp.gmail.com', 465);
        results.checks.push({ step: 'TCP Connect Port 465', status: tcp465 === 'Connected' ? 'OK' : 'FAILED', error: tcp465 });
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
