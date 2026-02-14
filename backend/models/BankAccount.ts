import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount extends Document {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    accountType: 'savings' | 'current';
    theme: string; // For card customization
    mmid?: string;
    vpa?: string;
}

const BankAccountSchema: Schema = new Schema({
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    branch: { type: String, required: true },
    accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
    theme: { type: String, required: false },
    mmid: { type: String, required: false },
    vpa: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
