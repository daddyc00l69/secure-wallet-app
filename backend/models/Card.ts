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

    holder: string; // Virtual
    encryptedHolder: string;
    holderIv: string;

    expiry?: string; // Virtual
    encryptedExpiry?: string;
    expiryIv?: string;

    type: string;
    theme: string;

    pin?: string; // Virtual
    encryptedPin?: string;
    pinIv?: string;

    image?: string;
    category?: string;

    bank?: string; // Virtual
    encryptedBank?: string;
    bankIv?: string;

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

    // Encrypted Holder
    encryptedHolder: { type: String, required: true },
    holderIv: { type: String, required: true },

    // Encrypted Expiry
    encryptedExpiry: { type: String, required: false },
    expiryIv: { type: String, required: false },

    type: { type: String, required: true },
    theme: { type: String, required: true },

    // Encrypted PIN
    encryptedPin: { type: String, required: false },
    pinIv: { type: String, required: false },

    image: { type: String, required: false },
    category: { type: String, required: false, enum: ['credit', 'debit', 'forex', 'identity'], default: 'credit' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Encrypted Bank
    encryptedBank: { type: String, required: false },
    bankIv: { type: String, required: false }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret: any) {
            delete ret.encryptedNumber;
            delete ret.iv;
            delete ret.encryptedCvv;
            delete ret.cvvIv;
            delete ret.encryptedHolder;
            delete ret.holderIv;
            delete ret.encryptedExpiry;
            delete ret.expiryIv;
            delete ret.encryptedPin;
            delete ret.pinIv;
            delete ret.encryptedBank;
            delete ret.bankIv;
            if (ret.id) delete ret.id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for 'number'
CardSchema.virtual('number')
    .set(function (value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedNumber = content;
            this.iv = iv;
            this.last4 = value.slice(-4);
        }
    })
    .get(function () {
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
        return '***';
    });

// Virtual for 'holder'
CardSchema.virtual('holder')
    .set(function (this: ICard, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedHolder = content;
            this.holderIv = iv;
        }
    })
    .get(function (this: ICard) {
        if (!this.encryptedHolder || !this.holderIv) return undefined;
        try {
            return decrypt({ iv: this.holderIv, content: this.encryptedHolder });
        } catch (e) { return 'Encrypted'; }
    });

// Virtual for 'expiry'
CardSchema.virtual('expiry')
    .set(function (this: ICard, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedExpiry = content;
            this.expiryIv = iv;
        }
    })
    .get(function (this: ICard) {
        if (!this.encryptedExpiry || !this.expiryIv) return undefined;
        try {
            return decrypt({ iv: this.expiryIv, content: this.encryptedExpiry });
        } catch (e) { return '**/**'; }
    });

// Virtual for 'pin'
CardSchema.virtual('pin')
    .set(function (this: ICard, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedPin = content;
            this.pinIv = iv;
        }
    })
    .get(function (this: ICard) {
        if (!this.encryptedPin || !this.pinIv) return undefined;
        try {
            return decrypt({ iv: this.pinIv, content: this.encryptedPin });
        } catch (e) { return '****'; }
    });

// Virtual for 'bank'
CardSchema.virtual('bank')
    .set(function (this: ICard, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedBank = content;
            this.bankIv = iv;
        }
    })
    .get(function (this: ICard) {
        if (!this.encryptedBank || !this.bankIv) return undefined;
        try {
            return decrypt({ iv: this.bankIv, content: this.encryptedBank });
        } catch (e) { return 'Bank'; }
    });

// Methods to get decrypted values (Explicit)
CardSchema.methods.getDecryptedNumber = function () {
    return decrypt({ iv: this.iv, content: this.encryptedNumber });
};

CardSchema.methods.getDecryptedCvv = function () {
    if (!this.encryptedCvv || !this.cvvIv) return undefined;
    return decrypt({ iv: this.cvvIv, content: this.encryptedCvv });
};

export default mongoose.model<ICard>('Card', CardSchema);
