import express, { Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import { auth, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get All Tickets (Manager & Admin)
router.get('/tickets', auth, authorize(['manager', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        // Auto-delete tickets closed > 24h ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await SupportTicket.deleteMany({ status: 'closed', closedAt: { $lt: twentyFourHoursAgo } });

        const tickets = await SupportTicket.find({
            $or: [
                { status: { $ne: 'closed' } }, // Open or In Progress
                { status: 'closed' } // All remaining closed tickets are valid (< 24h)
            ]
        })
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Reply to Ticket (Manager & Admin)
router.post('/tickets/:id/reply', auth, authorize(['manager', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        ticket.messages.push({
            sender: 'agent',
            message,
            timestamp: new Date()
        });

        // Update last message metadata
        ticket.lastMessageAt = new Date();
        ticket.lastMessageSender = 'agent';

        // Auto-update status to in_progress if it was open
        if (ticket.status === 'open') {
            ticket.status = 'in_progress';
        }

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Close Ticket (Manager & Admin)
router.post('/tickets/:id/close', auth, authorize(['manager', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        ticket.status = 'closed';
        ticket.closedAt = new Date();
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Toggle File Upload Permission (Manager & Admin)
router.post('/tickets/:id/toggle-upload', auth, authorize(['manager', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        ticket.allowAttachments = !ticket.allowAttachments;
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

export default router;

// Escalate Ticket
router.post('/tickets/:id/escalate', auth, authorize(['manager']), async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        ticket.escalated = true;
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Reopen Ticket
router.post('/tickets/:id/reopen', auth, authorize(['manager', 'admin']), async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        // Check if it's been closed for more than 24 hours (User restriction only - implemented in frontend/user routes if needed)
        // Manager overrules this.


        ticket.status = 'open';
        ticket.closedAt = undefined;
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});
