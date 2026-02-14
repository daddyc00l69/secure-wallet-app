import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

export interface ICard extends Document {
    number: string; // Virtual for input/masked output
    encryptedNumber: string;
    iv: string;
    last4: string;

    cvv: string; // Virtual for input/masked output
    encryptedCvv?: string;
    cvvIv?: string;

    holder: string;
    expiry: string; // Optional for Identity?
    type: string;
    theme: string;
    pin: string; // App Lock PIN or Card PIN (Stored plain or hashed? Assuming plain for now based on legacy code)
    image?: string;
    category?: string;
    bank?: string;

    getDecryptedNumber(): string;
    getDecryptedCvv(): string | undefined;
}

const CardSchema: Schema = new Schema({
    // Encrypted Number
    encryptedNumber: { type: String, required: true },
    iv: { type: String, required: true },
    last4: { type: String, required: true },

    // Encrypted CVV
    encryptedCvv: { type: String, required: false },
    cvvIv: { type: String, required: false },

    holder: { type: String, required: true },
    expiry: { type: String, required: false }, // Optional for Identity
    type: { type: String, required: true },
    theme: { type: String, required: true },
    pin: { type: String, required: false },    // Optional for Identity
    image: { type: String, required: false },
    category: { type: String, required: false, enum: ['credit', 'debit', 'forex', 'identity'], default: 'credit' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bank: { type: String, required: false }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.encryptedNumber;
            delete ret.iv;
            delete ret.encryptedCvv;
            delete ret.cvvIv;
            delete ret.id; // Optional: Keep _id or id
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for 'number'
CardSchema.virtual('number')
    .set(function (value: string) {
        if (value) {
            // Check if already encrypted (migration scenario) or new plain text
            // Assuming new plain text
            const { iv, content } = encrypt(value);
            this.encryptedNumber = content;
            this.iv = iv;
            this.last4 = value.slice(-4);
        }
    })
    .get(function () {
        // Return masked number by default
        return this.last4 ? `**** **** **** ${this.last4}` : undefined;
    });

// Virtual for 'cvv'
CardSchema.virtual('cvv')
    .set(function (value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedCvv = content;
            this.cvvIv = iv;
        }
    })
    .get(function () {
        return '***'; // Always mask CVV
    });

// Methods to get decrypted values
CardSchema.methods.getDecryptedNumber = function () {
    return decrypt({ iv: this.iv, content: this.encryptedNumber });
};

CardSchema.methods.getDecryptedCvv = function () {
    if (!this.encryptedCvv || !this.cvvIv) return undefined;
    return decrypt({ iv: this.cvvIv, content: this.encryptedCvv });
};

export default mongoose.model<ICard>('Card', CardSchema);
