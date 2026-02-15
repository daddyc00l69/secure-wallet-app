import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

export interface IAddress extends Document {
    label: string; // 'Home', 'Work', 'Other'

    // Virtuals
    line1: string;
    line2: string;
    line3?: string;
    landmark?: string;
    city: string;
    zipCode: string;

    // Encrypted Storage
    encryptedLine1: string;
    line1Iv: string;

    encryptedLine2?: string;
    line2Iv?: string;

    encryptedCity: string;
    cityIv: string;

    encryptedZipCode: string;
    zipCodeIv: string;

    state: string; // Keep state/country plain for filtering? Or encrypt all? User said "addresses... encrypted". Let's encrypt standard PII fields.
    country: string;
}

const AddressSchema: Schema = new Schema({
    label: { type: String, required: true },

    // Encrypted Fields
    encryptedLine1: { type: String, required: true },
    line1Iv: { type: String, required: true },

    encryptedLine2: { type: String, required: false },
    line2Iv: { type: String, required: false },

    encryptedCity: { type: String, required: true },
    cityIv: { type: String, required: true },

    encryptedZipCode: { type: String, required: true },
    zipCodeIv: { type: String, required: true },

    // Keeping these plain for now as they are less sensitive and useful for broad queries, 
    // but if user wants "even i cant see", maybe I should encrypt them too? 
    // Usually City/State/Country are okay. Line1/Line2 are the specific location.
    // Let's stick to Line1, Line2, ZipCode (precise location) + City (semi-precise).
    line3: { type: String, required: false }, // Encrypting line3 if used? 
    // Wait, let's just encrypt line1, line2, city, zip. 
    landmark: { type: String, required: false },

    state: { type: String, required: true },
    country: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret: any) {
            delete ret.encryptedLine1;
            delete ret.line1Iv;
            delete ret.encryptedLine2;
            delete ret.line2Iv;
            delete ret.encryptedCity;
            delete ret.cityIv;
            delete ret.encryptedZipCode;
            delete ret.zipCodeIv;
            if (ret.id) delete ret.id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtuals

// Line 1
AddressSchema.virtual('line1')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedLine1 = content;
            this.line1Iv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedLine1 || !this.line1Iv) return undefined;
        return decrypt({ iv: this.line1Iv, content: this.encryptedLine1 });
    });

// Line 2
AddressSchema.virtual('line2')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedLine2 = content;
            this.line2Iv = iv;
        } else {
            this.encryptedLine2 = undefined;
            this.line2Iv = undefined;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedLine2 || !this.line2Iv) return '';
        return decrypt({ iv: this.line2Iv, content: this.encryptedLine2 });
    });

// City
AddressSchema.virtual('city')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedCity = content;
            this.cityIv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedCity || !this.cityIv) return undefined;
        return decrypt({ iv: this.cityIv, content: this.encryptedCity });
    });

// ZipCode
AddressSchema.virtual('zipCode')
    .set(function (this: any, value: string) {
        if (value) {
            const { iv, content } = encrypt(value);
            this.encryptedZipCode = content;
            this.zipCodeIv = iv;
        }
    })
    .get(function (this: any) {
        if (!this.encryptedZipCode || !this.zipCodeIv) return undefined;
        return decrypt({ iv: this.zipCodeIv, content: this.encryptedZipCode });
    });

export default mongoose.model<IAddress>('Address', AddressSchema);
