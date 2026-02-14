import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
    label: string; // 'Home', 'Work', 'Other'
    line1: string;
    line2: string;
    line3?: string;
    landmark?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

const AddressSchema: Schema = new Schema({
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, required: false }, // Made optional
    line3: { type: String, required: false },
    landmark: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<IAddress>('Address', AddressSchema);
