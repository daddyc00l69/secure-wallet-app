import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import SupportTicket from '../models/SupportTicket';

const router = express.Router();

// Helper for Basic AI Response
const generateAIResponse = (message: string): string => {
    const msg = message.toLowerCase();
    if (msg.includes('password') || msg.includes('reset') || msg.includes('forgot')) {
        return "To reset your password, please logout and use the 'Forgot Password' link on the login screen. If you are still having issues, an admin will assist you shortly.";
    }
    if (msg.includes('pin') || msg.includes('lock')) {
        return "You can manage your App Lock PIN in the Settings tab. If you forgot your PIN, you can reset it using your password.";
    }
    if (msg.includes('card') || msg.includes('add') || msg.includes('create')) {
        return "You can add new cards or bank accounts directly from your Dashboard. Just click the '+' button.";
    }
    return "Thank you for contacting support. Our AI agent has received your query. A human manager will review it shortly and get back to you if further assistance is needed.";
};

// Create a new support ticket
router.post('/', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { subject, message, type } = req.body;

        console.log('Support Ticket Request User:', JSON.stringify(req.user, null, 2));

        if (!subject || !message || !type) {
            res.status(400).json({ message: 'Please provide all fields' });
            return;
        }

        const newTicket = new SupportTicket({
            user: req.user?.user?.id,
            subject,
            message,
            type,
            lastMessageAt: new Date(),
            lastMessageSender: 'user',
            messages: []
        });

        // AI Auto-Reply for new tickets
        const aiResponse = generateAIResponse(message);
        newTicket.messages.push({
            sender: 'agent',
            message: aiResponse,
            timestamp: new Date()
        });
        newTicket.lastMessageSender = 'agent';

        const ticket = await newTicket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Get all tickets for the current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
    try {
        // Auto-delete tickets closed > 24h ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await SupportTicket.deleteMany({ status: 'closed', closedAt: { $lt: twentyFourHoursAgo } });

        const tickets = await SupportTicket.find({ user: req.user?.user?.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Helper to add message to ticket (User side)
router.post('/:id/reply', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        // Verify ticket belongs to user
        if (ticket.user.toString() !== req.user?.user?.id) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }

        // RESTRICTION REMOVED: Since we have an AI agent now, we want the user to be able to reply to the AI.
        // The original restriction blocked user if lastSender was user. 
        // Now lastSender will likely be 'agent' (AI) immediately after user reply.

        ticket.messages.push({
            sender: 'user',
            message,
            timestamp: new Date()
        });

        // AI Auto-Reply
        const aiResponse = generateAIResponse(message);
        setTimeout(async () => {
            // We can't really do async setTimeout easily without re-fetching or passing the object reference cleanly if we want it to persist.
            // For simplicity in this synchronous flow, we'll just append it immediately. 
            // If we wanted a "typing" delay, we'd need sockets or a separate job.
            // Immediate reply is fine for a basic bot.
        }, 0);

        ticket.messages.push({
            sender: 'agent',
            message: aiResponse,
            timestamp: new Date()
        });

        // Update last message metadata
        ticket.lastMessageAt = new Date();
        ticket.lastMessageSender = 'agent'; // AI replied

        if (ticket.status === 'closed') {
            ticket.status = 'open';
            ticket.closedAt = undefined;
        }

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Multer Setup
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDFs are allowed'));
    }
});

// Upload Attachment Endpoint
router.post('/:id/upload', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.user.toString() !== req.user?.user?.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!ticket.allowAttachments) {
            return res.status(403).json({ message: 'Uploads are not allowed for this ticket.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newAttachment = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date()
        };

        ticket.attachments.push(newAttachment);

        // Add a system message about the upload
        ticket.messages.push({
            sender: 'user',
            message: `[Attachment Uploaded: ${req.file.originalname}]`,
            timestamp: new Date()
        });

        ticket.lastMessageAt = new Date();
        ticket.lastMessageSender = 'user';

        if (ticket.status === 'closed') {
            ticket.status = 'open';
            ticket.closedAt = undefined;
        }

        await ticket.save();
        res.json(ticket);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

export default router;
