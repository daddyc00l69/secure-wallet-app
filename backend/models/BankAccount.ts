import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

export interface IBankAccount extends Document {
    bankName: string;

    // Virtuals
    accountHolder: string;
    accountNumber: string;
    ifsc: string;

    // Encrypted Storage
    encryptedAccountHolder: string;
    accountHolderIv: string;

    encryptedAccountNumber: string;
    accountNumberIv: string;

    encryptedIfsc: string;
    ifscIv: string;

    branch: string;
    accountType: 'savings' | 'current';
    theme: string;
    mmid?: string;
    vpa?: string;

    getDecryptedAccountHolder(): string;
    getDecryptedAccountNumber(): string;
    getDecryptedIfsc(): string;
}

const BankAccountSchema: Schema = new Schema({
    bankName: { type: String, required: true },

    // Encrypted Fields
    encryptedAccountHolder: { type: String, required: true },
    accountHolderIv: { type: String, required: true },

    encryptedAccountNumber: { type: String, required: true },
    accountNumberIv: { type: String, required: true },

    encryptedIfsc: { type: String, required: true },
    ifscIv: { type: String, required: true },

    branch: { type: String, required: true },
    accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
    theme: { type: String, required: false },
    mmid: { type: String, required: false },
    vpa: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret: any) {
            delete ret.encryptedAccountHolder;
            delete ret.accountHolderIv;
            delete ret.encryptedAccountNumber;
            delete ret.accountNumberIv;
            delete ret.encryptedIfsc;
            delete ret.ifscIv;
            if (ret.id) delete ret.id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtuals for Encryption/Decryption

// Account Holder
BankAccountSchema.virtual('accountHolder')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedAccountHolder = content;
            this.accountHolderIv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedAccountHolder || !this.accountHolderIv) return undefined;
        return decrypt({ iv: this.accountHolderIv, content: this.encryptedAccountHolder });
    });

// Account Number
BankAccountSchema.virtual('accountNumber')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedAccountNumber = content;
            this.accountNumberIv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedAccountNumber || !this.accountNumberIv) return undefined;
        // Mask for safety in default view, or return plain? 
        // User requested "encrapated... even i cant see". 
        // But frontend needs to see it? 
        // Let's decrypt it here so the API returns it (frontend needs it), 
        // but it is encrypted in DB.
        return decrypt({ iv: this.accountNumberIv, content: this.encryptedAccountNumber });
    });

// IFSC
BankAccountSchema.virtual('ifsc')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedIfsc = content;
            this.ifscIv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedIfsc || !this.ifscIv) return undefined;
        return decrypt({ iv: this.ifscIv, content: this.encryptedIfsc });
    });

export default mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
