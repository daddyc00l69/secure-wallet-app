import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: any;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

export const authorize = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const User = require('../models/User').default;
            const user = await User.findById(req.user?.user?.id);

            if (!user || !roles.includes(user.role)) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
            next();
        } catch (err) {
            res.status(500).send('Server Error');
        }
    };
};

export const requireEditAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const User = require('../models/User').default;
        const TempAccess = require('../models/TempAccess').default;

        const user = await User.findById(req.user?.user?.id);

        // 1. Admins and Managers always have access
        if (user && ['admin', 'manager'].includes(user.role)) {
            return next();
        }

        // 2. Check for Access Token in Headers
        const token = req.header('x-access-token');
        if (!token) {
            return res.status(403).json({ message: 'Edit access required. Please request access from support.' });
        }

        const access = await TempAccess.findOne({ token, userId: user._id, used: false });
        if (!access || access.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Access link expired or invalid.' });
        }

        // 3. Optional: Auto-consume token here? 
        // The user might need to make multiple save requests (e.g. save profile, then save card).
        // Let's keep it valid until expiry or explicit consume.
        // For "only one time", we could mark used AFTER the action in the controller. 
        // But for now, let's just allow it for the duration of the session/token (15m).

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error checking access');
    }
};
