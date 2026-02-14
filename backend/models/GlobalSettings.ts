import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalSettings extends Document {
    allowUserUploads: boolean;
}

const GlobalSettingsSchema: Schema = new Schema({
    allowUserUploads: { type: Boolean, default: true } // Default to true
}, { timestamps: true });

// Ensure only one document exists (Singleton pattern usually handled in controller, 
// but we can enforce logic there)
export default mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);
