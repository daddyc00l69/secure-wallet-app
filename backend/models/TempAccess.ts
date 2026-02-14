import mongoose from 'mongoose';

const TempAccessSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['edit_profile'] },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: '15m' } // Auto-delete doc after 15m (or custom logic)
});

export default mongoose.model('TempAccess', TempAccessSchema);
