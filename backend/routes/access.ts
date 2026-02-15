import express from 'express';
import crypto from 'crypto';
import TempAccess from '../models/TempAccess';
import { auth, authorize } from '../middleware/auth';
// import { API_URL } from '../config'; 


const router = express.Router();

// Grant Access
router.post('/grant', auth, authorize(['admin', 'manager']), async (req, res) => {
    try {
        const { userId, type = 'edit_profile', permissions = { canAdd: false, canEdit: true, canDelete: true } } = req.body;

        // Generate a short random token (8 characters)
        const token = crypto.randomBytes(4).toString('hex');

        // Expiry handled by startedAt + duration. 
        // We set a theoretical "hard" expiry for the DB record via mongoose schema (7 days), 
        // but logic depends on :
        // 1. If startedAt is null -> Valid (waiting to start)
        // 2. If startedAt is set -> Check if now < startedAt + duration

        const tempAccess = new TempAccess({
            userId,
            token,
            type,
            permissions,
            startedAt: null, // Not started
            duration: 15 * 60 * 1000 // 15 minutes
        });

        await tempAccess.save();

        res.json({
            success: true,
            token,
            link: `/secure-edit?token=${token}`
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

        if (!access) {
            return res.status(400).json({ valid: false, message: 'Invalid link' });
        }

        const now = new Date();

        // 1. Check if First Click (Start the Timer)
        if (!access.startedAt) {
            access.startedAt = now;
            await access.save();
        } else {
            // 2. Check Expiry based on startedAt + duration
            const expiryTime = new Date(access.startedAt.getTime() + access.duration);
            if (now > expiryTime) {
                return res.status(400).json({ valid: false, message: 'Link has expired (15m limit exceeded)' });
            }
        }

        res.json({ valid: true, type: access.type, userId: access.userId, permissions: access.permissions });
    } catch (err) {
        res.status(500).json({ message: 'Server error verifying token' });
    }
});

// Consume Token (Internal/After Save) - Optional if we want it reusable within 15 mins
// User asked for "15 min", implicating they can use it for 15 mins. 
// So maybe we DON'T consume it immediately after one save? 
// Original code consumed it. User said "15 min when he opens 1 stime then time sterts".
// This implies a session window. Let's NOT consume it on save, just let it expire.
router.post('/consume', async (req, res) => {
    // We will disable manual consumption for now to allow multiple edits within the window
    // Or we can keep it if "Submit" is final. 
    // Let's keep it but maybe frontend calls it only on final "Finish"?
    // For now, let's just return success without setting used=true to allow multiple saves (Card + Bank + Profile)
    res.json({ success: true, message: 'Kept active for duration window' });
});

// Update Data via Token
router.post('/update-data', async (req, res) => {
    try {
        const { token, type, data } = req.body; // type: 'profile' | 'card' | 'bank'
        const access = await TempAccess.findOne({ token, used: false });

        if (!access) return res.status(400).json({ message: 'Invalid token' });

        // Re-check expiry
        if (access.startedAt) {
            const expiryTime = new Date(access.startedAt.getTime() + access.duration);
            if (new Date() > expiryTime) return res.status(400).json({ message: 'Link expired' });
        } else {
            // Should be started by verify, but safe fallback
            access.startedAt = new Date();
            await access.save();
        }

        const User = require('../models/User').default || require('../models/User');
        const Card = require('../models/Card').default || require('../models/Card');
        const BankAccount = require('../models/BankAccount').default || require('../models/BankAccount');

        if (type === 'profile') {
            await User.findByIdAndUpdate(access.userId, {
                username: data.username,
                email: data.email
            });
        } else if (type === 'card') {
            // Create new or update? User likely wants to ADD a card if they are providing info.
            // Or replace existing? Secure Edit usually assumes fixing info.
            // Let's assume ADD a new card for now, or updating is too complex without an ID.
            // Requirement: "user can edit email and user name and card info bank info"

            // SECURITY: Delete old cards/banks for this user to ensure only valid ones remain? 
            // Or just Add. let's Add.
            const newCard = new Card({ ...data, user: access.userId });
            await newCard.save();
        } else if (type === 'bank') {
            const newBank = new BankAccount({ ...data, user: access.userId });
            await newBank.save();
        }

        res.json({ success: true, message: 'Data updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating data' });
    }
});

export default router;
