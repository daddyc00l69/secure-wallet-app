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
    // Restriction disabled per user request
    return next();
};
