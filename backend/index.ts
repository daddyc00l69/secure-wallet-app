import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Card from './models/Card';
import BankAccount from './models/BankAccount';
import Address from './models/Address';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => res.send('Server Running'));
app.get('/healthCheck', (req, res) => res.status(200).json({ status: 'ok', message: 'Server is healthy' }));

app.use((req, res, next) => {
    console.log(`[Global Trace] ${req.method} ${req.url}`);
    next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(origin => origin.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check against allowed origins list
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Check if origin matches Vercel subdomain pattern (Automatic allow for all Vercel previews)
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        console.error(`Blocked by CORS: '${origin}'`);
        console.error(`Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Auth Routes
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// Support Routes
import supportRoutes from './routes/support';
app.use('/api/support', supportRoutes);

// Admin Routes
// Admin Routes
import adminRoutes from './routes/admin';
app.use('/api/admin', (req, res, next) => {
    console.log(`[Debug] Admin/Manager route hit: ${req.method} ${req.originalUrl}`);
    next();
}, adminRoutes);

// Manager Routes
import managerRoutes from './routes/manager';
app.use('/api/manager', managerRoutes);

import { auth, AuthRequest } from './middleware/auth';

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wallet_db')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Routes
app.get('/api/cards', auth, async (req: AuthRequest, res) => {
    try {
        const cards = await Card.find({ user: req.user.user.id });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

app.post('/api/cards', auth, async (req: AuthRequest, res) => {
    try {
        const newCard = new Card({ ...req.body, user: req.user.user.id });
        const savedCard = await newCard.save();
        res.json(savedCard);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

app.delete('/api/cards/:id', auth, async (req: AuthRequest, res) => {
    try {
        const card = await Card.findOne({ _id: req.params.id, user: req.user.user.id });
        if (!card) {
            res.status(404).json({ message: 'Card not found' });
            return;
        }
        await Card.findByIdAndDelete(req.params.id);
        res.json({ message: 'Card deleted' });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// Bank Account Routes
app.get('/api/bank-accounts', auth, async (req: AuthRequest, res) => {
    try {
        const accounts = await BankAccount.find({ user: req.user.user.id });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

app.post('/api/bank-accounts', auth, async (req: AuthRequest, res) => {
    try {
        const newAccount = new BankAccount({ ...req.body, user: req.user.user.id });
        const savedAccount = await newAccount.save();
        res.json(savedAccount);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

app.delete('/api/bank-accounts/:id', auth, async (req: AuthRequest, res) => {
    try {
        const account = await BankAccount.findOne({ _id: req.params.id, user: req.user.user.id });
        if (!account) {
            res.status(404).json({ message: 'Bank Account not found' });
            return;
        }
        await BankAccount.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bank Account deleted' });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// Address Routes
app.get('/api/addresses', auth, async (req: AuthRequest, res) => {
    try {
        const addresses = await Address.find({ user: req.user.user.id });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

app.post('/api/addresses', auth, async (req: AuthRequest, res) => {
    try {
        const newAddress = new Address({ ...req.body, user: req.user.user.id });
        const savedAddress = await newAddress.save();
        res.json(savedAddress);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

app.delete('/api/addresses/:id', auth, async (req: AuthRequest, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.user.id });
        if (!address) {
            res.status(404).json({ message: 'Address not found' });
            return;
        }
        await Address.findByIdAndDelete(req.params.id);
        res.json({ message: 'Address deleted' });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// Verify PIN endpoint
app.post('/api/cards/:id/verify-pin', auth, async (req: AuthRequest, res) => {
    try {
        const { pin } = req.body;
        const card = await Card.findOne({ _id: req.params.id, user: req.user.user.id });
        if (!card) {
            res.status(404).json({ message: 'Card not found' });
            return;
        }

        if (card.pin === pin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid PIN' });
        }
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
