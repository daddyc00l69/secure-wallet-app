import express from 'express';
import crypto from 'crypto';
import TempAccess from '../models/TempAccess';
import { auth, authorize } from '../middleware/auth';
import { API_URL } from '../config'; // Wait, backend config? Usually backend uses env.

const router = express.Router();

// Grant Access (Admin/Manager Only)
router.post('/grant', auth, authorize(['admin', 'manager']), async (req, res) => {
    try {
        const { userId, type = 'edit_profile' } = req.body;

        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const tempAccess = new TempAccess({
            userId,
            token,
            type,
            expiresAt
        });

        await tempAccess.save();

        res.json({
            success: true,
            token,
            expiresAt,
            link: `/secure-edit?token=${token}` // Frontend route
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error generating access token' });
    }
});

// Verify Token (Public/User)
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        const access = await TempAccess.findOne({ token, used: false });

        if (!access || access.expiresAt < new Date()) {
            return res.status(400).json({ valid: false, message: 'Invalid or expired link' });
        }

        res.json({ valid: true, type: access.type, userId: access.userId });
    } catch (err) {
        res.status(500).json({ message: 'Server error verifying token' });
    }
});

// Consume Token (Internal/After Save)
router.post('/consume', async (req, res) => {
    try {
        const { token } = req.body;
        const access = await TempAccess.findOne({ token });

        if (access) {
            access.used = true;
            await access.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error consuming token' });
    }
});

export default router;
