import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendOTP, sendWelcomeEmail, sendSecurityAlert, sendManagerSuccess } from '../utils/email';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        user = await User.findOne({ username });
        if (user) {
            res.status(400).json({ message: 'Username already taken' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user = new User({
            username,
            email,
            password,
            otp,
            otpExpires,
            isVerified: false
        });

        await user.save();

        // Send OTP
        await sendOTP(email, otp);
        console.log(`OTP for ${email}: ${otp}`); // For dev/testing

        res.json({ message: 'OTP sent to email' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Setup Manager (Complete Invitation - Upgrade Role)
router.post('/setup-manager', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
            res.status(400).json({ message: 'Invalid or expired Code' });
            return;
        }

        // Upgrade Role
        user.role = 'manager';
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        // Send Success Email
        await sendManagerSuccess(user.email, user.username);

        res.json({ message: 'Manager verified successfully. You can now login.' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(400).json({ message: 'Invalid User' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ message: 'User already verified' });
            return;
        }

        if (user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Send Welcome Email
        await sendWelcomeEmail(user.email, user.username);

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Allow login with either username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid Credentials' });
            return;
        }

        if (!user.isVerified) {
            res.status(400).json({ message: 'Please verify your email first' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid Credentials' });
            return;
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified } });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Get Current User
import { auth, AuthRequest } from '../middleware/auth';
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.user.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({
            ...user.toObject(),
            appLockPin: undefined,
            hasPin: !!user.appLockPin
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Set App Lock PIN
router.post('/set-pin', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { pin } = req.body;
        if (!pin || pin.length !== 4) {
            res.status(400).json({ message: 'PIN must be 4 digits' });
            return;
        }

        const user = await User.findById(req.user?.user?.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.appLockPin = pin;
        await user.save();

        await sendSecurityAlert(user.email, 'PIN_SET');

        res.json({ message: 'App lock PIN set successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Verify App Lock PIN
router.post('/verify-pin', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { pin } = req.body;
        const user = await User.findById(req.user?.user?.id);

        if (!user || !user.appLockPin) {
            res.status(400).json({ message: 'PIN not set' });
            return;
        }

        const isMatch = await bcrypt.compare(pin, user.appLockPin);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid PIN' });
            return;
        }

        res.json({ success: true });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOTP(email, otp);
        console.log(`Reset OTP for ${email}: ${otp}`);

        res.json({ message: 'OTP sent to email' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Reset App Lock PIN with Password
router.post('/reset-pin-with-password', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user?.user?.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid password' });
            return;
        }

        user.appLockPin = undefined; // Remove PIN
        await user.save();

        await sendSecurityAlert(user.email, 'PIN_REMOVED');

        res.json({ message: 'App lock removed successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Verify Password (for sensitive actions)
router.post('/verify-password', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user?.user?.id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid password' });
            return;
        }

        res.json({ success: true });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Save Encrypted Backup
router.post('/backup', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { encryptedData } = req.body;
        const user = await User.findById(req.user?.user?.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.encryptedData = encryptedData;
        await user.save();
        res.json({ message: 'Backup saved to cloud successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// Get Encrypted Backup
router.get('/backup', auth, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.user?.id);
        if (!user || !user.encryptedData) {
            res.status(404).json({ message: 'No backup found' });
            return;
        }
        res.json({ encryptedData: user.encryptedData });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

export default router;
