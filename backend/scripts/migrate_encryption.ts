import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BankAccount from '../models/BankAccount';
import Address from '../models/Address';
import { encrypt } from '../utils/encryption';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is missing');
    process.exit(1);
}

// Manual Interface for Old Data (Plain Text)
interface IOldBankAccount {
    _id: mongoose.Types.ObjectId;
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    save: () => Promise<any>;
    update: (update: any) => Promise<any>; // Using update to unset
    toJSON: () => any;
}

interface IOldAddress {
    _id: mongoose.Types.ObjectId;
    line1?: string;
    line2?: string;
    city?: string;
    zipCode?: string;
    save: () => Promise<any>;
    toJSON: () => any;
}

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Migrate Bank Accounts
        console.log('Migrating Bank Accounts...');
        const accounts = await BankAccount.find({});
        for (const account of accounts) {
            const acc = account as any; // Cast to access potential plain fields
            let modified = false;

            // Check if plain text exists and encrypt it
            if (acc._doc.accountHolder && !acc.encryptedAccountHolder) {
                console.log(`Encrypting holder for account ${acc._id}`);
                const { iv, content } = encrypt(acc._doc.accountHolder);
                acc.encryptedAccountHolder = content;
                acc.accountHolderIv = iv;
                acc.set('accountHolder', undefined, { strict: false }); // Remove plain
                modified = true;
            }

            if (acc._doc.accountNumber && !acc.encryptedAccountNumber) {
                console.log(`Encrypting number for account ${acc._id}`);
                const { iv, content } = encrypt(acc._doc.accountNumber);
                acc.encryptedAccountNumber = content;
                acc.accountNumberIv = iv;
                acc.set('accountNumber', undefined, { strict: false });
                modified = true;
            }

            if (acc._doc.ifsc && !acc.encryptedIfsc) {
                console.log(`Encrypting ifsc for account ${acc._id}`);
                const { iv, content } = encrypt(acc._doc.ifsc);
                acc.encryptedIfsc = content;
                acc.ifscIv = iv;
                acc.set('ifsc', undefined, { strict: false });
                modified = true;
            }

            if (modified) {
                // Use updateOne to explicitly unset plain fields and set encrypted ones
                // because Mongoose save() might strict-type check against the NEW schema 
                // and ignore the plain fields we want to remove, or error out.
                // Actually, since we updated the model schema to NOT have plain fields, 
                // accessing them via _doc is correct. 
                // To remove them from DB, we need $unset.

                const updateData: any = {
                    encryptedAccountHolder: acc.encryptedAccountHolder,
                    accountHolderIv: acc.accountHolderIv,
                    encryptedAccountNumber: acc.encryptedAccountNumber,
                    accountNumberIv: acc.accountNumberIv,
                    encryptedIfsc: acc.encryptedIfsc,
                    ifscIv: acc.ifscIv
                };

                const unsetData: any = {
                    accountHolder: 1,
                    accountNumber: 1,
                    ifsc: 1
                };

                await BankAccount.updateOne({ _id: acc._id }, { $set: updateData, $unset: unsetData });
                console.log(`Migrated BankAccount ${acc._id}`);
            }
        }

        // 2. Migrate Addresses
        console.log('Migrating Addresses...');
        const addresses = await Address.find({});
        for (const address of addresses) {
            const addr = address as any;
            let modified = false;

            if (addr._doc.line1 && !addr.encryptedLine1) {
                const { iv, content } = encrypt(addr._doc.line1);
                addr.encryptedLine1 = content;
                addr.line1Iv = iv;
                modified = true;
            }
            if (addr._doc.line2 && !addr.encryptedLine2) { // Optional
                const { iv, content } = encrypt(addr._doc.line2);
                addr.encryptedLine2 = content;
                addr.line2Iv = iv;
                modified = true;
            }
            if (addr._doc.city && !addr.encryptedCity) {
                const { iv, content } = encrypt(addr._doc.city);
                addr.encryptedCity = content;
                addr.cityIv = iv;
                modified = true;
            }
            if (addr._doc.zipCode && !addr.encryptedZipCode) {
                const { iv, content } = encrypt(addr._doc.zipCode);
                addr.encryptedZipCode = content;
                addr.zipCodeIv = iv;
                modified = true;
            }

            if (modified) {
                const updateData: any = {
                    encryptedLine1: addr.encryptedLine1,
                    line1Iv: addr.line1Iv,
                    encryptedLine2: addr.encryptedLine2, // Update even if undefined? No, set if present.
                    line2Iv: addr.line2Iv,
                    encryptedCity: addr.encryptedCity,
                    cityIv: addr.cityIv,
                    encryptedZipCode: addr.encryptedZipCode,
                    zipCodeIv: addr.zipCodeIv
                };

                // Cleanup undefined
                Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

                const unsetData: any = {
                    line1: 1,
                    line2: 1,
                    city: 1,
                    zipCode: 1
                };

                await Address.updateOne({ _id: addr._id }, { $set: updateData, $unset: unsetData });
                console.log(`Migrated Address ${addr._id}`);
            }
        }

        console.log('Migration Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
