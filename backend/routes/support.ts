import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import SupportTicket from '../models/SupportTicket';

const router = express.Router();

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
            lastMessageSender: 'user'
        });

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

        // RESTRICTION: Block user reply if waiting for agent
        if (ticket.status === 'open' && ticket.lastMessageSender === 'user') {
            res.status(400).json({ message: 'Please wait for an agent to respond before sending another message.' });
            return;
        }

        ticket.messages.push({
            sender: 'user',
            message,
            timestamp: new Date()
        });

        // If ticket was closed, user can reopen it? 
        // User requested: "no 24h rule for manager is for user". 
        // This implies user HAS a 24h rule or some restriction? 
        // But also "if manager accpt ticket then user can chat".
        // Let's allow user to reply if status is NOT closed, OR if closed within 24h (the original rule for users).
        // For now, let's just allow reply and auto-reopen if closed? 
        // Actually, usually user replying to a closed ticket reopens it. 
        // Let's implement basic 24h check here for USER if they try to reply to a closed ticket.

        // Update last message metadata
        ticket.lastMessageAt = new Date();
        ticket.lastMessageSender = 'user';

        if (ticket.status === 'closed') {
            // Check 24h rule
            if (ticket.closedAt) {
                const timeDiff = Date.now() - new Date(ticket.closedAt).getTime();
                const hoursDiff = timeDiff / (1000 * 3600);
                if (hoursDiff > 24) {
                    res.status(400).json({ message: 'Ticket closed for more than 24 hours. Please create a new one.' });
                    return;
                }
            }
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
