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
    // 1. Allow 'ADD' (POST) operations globally without restriction
    // 1. Allow 'ADD' (POST) operations globally without restriction
    if (req.method === 'POST') {
        console.log(`[Access] Allowed POST request for ${req.originalUrl}`);
        return next();
    }

    console.log(`[Access] Checking edit access for ${req.method} ${req.originalUrl}`);

    try {
        const User = require('../models/User').default;
        const TempAccess = require('../models/TempAccess').default;

        const user = await User.findById(req.user?.user?.id);

        // 2. Admins, Managers, and APP_ADMIN always have access to Delete/Edit
        if (user && (['admin', 'manager'].includes(user.role) || (process.env.APP_ADMIN && user.email === process.env.APP_ADMIN))) {
            return next();
        }

        // 3. Check for Access Token in Headers (for DELETE/PUT)
        const token = req.header('x-access-token');
        if (!token) {
            return res.status(403).json({ message: 'Edit/Delete access required. Please request access from support.' });
        }

        const access = await TempAccess.findOne({ token, userId: user._id, used: false });
        if (!access || access.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Access link expired or invalid.' });
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error checking access');
    }
};

export const requireAddPermission = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Admin/Manager/AppAdmin always allowed
    try {
        const User = require('../models/User').default;
        const user = await User.findById(req.user?.user?.id);
        if (user && (['admin', 'manager'].includes(user.role) || (process.env.APP_ADMIN && user.email === process.env.APP_ADMIN))) {
            return next();
        }
    } catch (e) { /* Ignore if no user */ }

    // 2. Check Token Permissions
    const token = req.header('x-access-token');
    if (token) {
        try {
            const TempAccess = require('../models/TempAccess').default;
            const access = await TempAccess.findOne({ token });
            if (access && access.permissions?.canAdd) {
                return next();
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Default: Deny
    return res.status(403).json({ message: 'Permission denied: Cannot add new items.' });
};
