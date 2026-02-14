import express from 'express';
import GlobalSettings from '../models/GlobalSettings';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

// Get Settings (Public or Authenticated? Making it public for frontend toggle checks)
router.get('/', async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = await GlobalSettings.create({ allowUserUploads: true });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update Settings (Admin Only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    try {
        const { allowUserUploads } = req.body;

        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings({ allowUserUploads });
        } else {
            settings.allowUserUploads = allowUserUploads;
        }

        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
});

export default router;
