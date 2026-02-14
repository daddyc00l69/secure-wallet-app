import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import SupportTicket from '../models/SupportTicket';
import { auth, authorize } from '../middleware/auth';
import { sendManagerInvite } from '../utils/email';
import type { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get Analytics (Admin only)
router.get('/analytics', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalManagers = await User.countDocuments({ role: 'manager' });
        const totalTickets = await SupportTicket.countDocuments();
        const openTickets = await SupportTicket.countDocuments({ status: 'open' });

        res.json({
            users: totalUsers,
            managers: totalManagers,
            totalTickets,
            openTickets
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Invite Manager (Admin only)
router.post('/invite-manager', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    console.log(`[Invite Manager] Request received for: ${req.body.email}`);
    try {
        const { email } = req.body;

        let user = await User.findOne({ email });

        // Strict Requirement: User must exist and be verified
        if (!user) {
            console.log(`[Invite Manager] User not found: ${email}`);
            res.status(404).json({ message: 'User not found. Please ask them to register first.' });
            return;
        }

        if (!user.isVerified) {
            console.log(`[Invite Manager] User not verified: ${email}`);
            res.status(400).json({ message: 'User exists but is not verified. They must verify their email first.' });
            return;
        }

        if (user.role === 'manager' || user.role === 'admin') {
            console.log(`[Invite Manager] User is already manager/admin: ${email}`);
            res.status(400).json({ message: 'User is already a Manager or Admin.' });
            return;
        }

        // Generate 8-digit OTP
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
        const otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log(`[Invite Manager] OTP generated for user: ${user._id}`);

        // Send Invite Email
        const emailSent = await sendManagerInvite(email, otp);
        if (!emailSent) {
            console.error('[Invite Manager] Failed to send email');
            res.status(500).json({ message: 'Failed to send invitation email' });
            return;
        }

        console.log('[Invite Manager] Email sent successfully');
        res.json({ message: 'Invitation sent to email' });
    } catch (err) {
        console.error('[Invite Manager] Server Error:', err);
        res.status(500).send('Server error');
    }
});

// Get All Managers (Admin only)
router.get('/managers', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const managers = await User.find({ role: 'manager' }).select('-password');
        res.json(managers);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Delete Ticket (Admin only)
router.delete('/tickets/:id', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    const ticketId = req.params['id'] as string;
    console.log(`[Delete Ticket] Request received for ID: ${ticketId}`);
    try {
        if (!ticketId?.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[Delete Ticket] Invalid ID format: ${ticketId}`);
            res.status(400).json({ message: 'Invalid ticket ID' });
            return;
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            console.log(`[Delete Ticket] Ticket not found: ${ticketId}`);
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }
        await SupportTicket.findByIdAndDelete(ticketId);
        console.log(`[Delete Ticket] Successfully deleted ticket: ${ticketId}`);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error('[Delete Ticket] Error:', (err as Error).message);
        res.status(500).send('Server error');
    }
});

// Get Tickets (Admin View - All, with escalation filter)
router.get('/tickets', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        // Auto-delete tickets closed > 24h ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await SupportTicket.deleteMany({ status: 'closed', closedAt: { $lt: twentyFourHoursAgo } });

        const tickets = await SupportTicket.find()
            .populate('user', 'username email')
            .sort({ escalated: -1, lastMessageAt: -1 }); // Priority first, then recent activity
        res.json(tickets);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Get All Users (Admin only)
router.get('/users', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Update User Role (Admin only)
router.put('/users/:id/role', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;
        if (!['user', 'manager', 'admin'].includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.role = role;
        await user.save();
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});


// Update User Permissions (Admin only)
router.put('/users/:id/permissions', auth, authorize(['admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { canScreenshot } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (typeof canScreenshot === 'boolean') {
            user.canScreenshot = canScreenshot;
        }

        await user.save();
        res.json({ message: 'User permissions updated successfully', user });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

export default router;
