import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    type: string;
    theme: string;
    pin: string;
    image?: string;
    category?: string;
    bank?: string;
}

const CardSchema: Schema = new Schema({
    number: { type: String, required: true },
    holder: { type: String, required: true },
    expiry: { type: String, required: false }, // Optional for Identity
    cvv: { type: String, required: false },    // Optional for Identity
    type: { type: String, required: true },
    theme: { type: String, required: true },
    pin: { type: String, required: false },    // Optional for Identity
    image: { type: String, required: false },
    category: { type: String, required: false, enum: ['credit', 'debit', 'forex', 'identity'], default: 'credit' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bank: { type: String, required: false }
});

export default mongoose.model<ICard>('Card', CardSchema);
