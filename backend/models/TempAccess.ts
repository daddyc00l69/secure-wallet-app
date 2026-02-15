import mongoose from 'mongoose';

const TempAccessSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['edit_profile'] },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    permissions: {
        canAdd: { type: Boolean, default: false },
        canEdit: { type: Boolean, default: true },
        canDelete: { type: Boolean, default: true }
    },
    startedAt: { type: Date }, // When the link was first clicked
    duration: { type: Number, default: 15 * 60 * 1000 }, // Duration in ms (default 15 mins)
    createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete doc after 7 days if unused
});

export default mongoose.model('TempAccess', TempAccessSchema);
