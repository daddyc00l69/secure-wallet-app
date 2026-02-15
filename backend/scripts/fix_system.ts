import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import BankAccount from '../models/BankAccount';
import Address from '../models/Address';
import { encrypt } from '../utils/encryption';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
}

const fixSystem = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Fix Admin User
        console.log('Checking Test Admin user...');
        let adminUser = await User.findOne({ email: 'admin@test.app' });

        if (!adminUser) {
            console.log('Creating admin@test.app...');
            adminUser = new User({
                username: 'Test Admin',
                email: 'admin@test.app',
                password: 'test123',
                role: 'admin',
                isVerified: true
            });
        } else {
            console.log('Updating admin@test.app password...');
            adminUser.password = 'test123'; // Triggers hashing
            adminUser.role = 'admin';
            adminUser.isVerified = true;
        }
        await adminUser.save();
        console.log('Test Admin secured.');

        // 2. Run Database Encryption Migration
        console.log('Starting Encryption Migration...');

        // Bank Accounts
        const accounts = await BankAccount.find({});
        for (const account of accounts) {
            const acc = account as any;
            let modified = false;

            if (acc._doc.accountHolder && !acc.encryptedAccountHolder) {
                const { iv, content } = encrypt(acc._doc.accountHolder);
                acc.encryptedAccountHolder = content;
                acc.accountHolderIv = iv;
                modified = true;
            }
            if (acc._doc.accountNumber && !acc.encryptedAccountNumber) {
                const { iv, content } = encrypt(acc._doc.accountNumber);
                acc.encryptedAccountNumber = content;
                acc.accountNumberIv = iv;
                modified = true;
            }
            if (acc._doc.ifsc && !acc.encryptedIfsc) {
                const { iv, content } = encrypt(acc._doc.ifsc);
                acc.encryptedIfsc = content;
                acc.ifscIv = iv;
                modified = true;
            }

            if (modified) {
                const updateData: any = {
                    encryptedAccountHolder: acc.encryptedAccountHolder,
                    accountHolderIv: acc.accountHolderIv,
                    encryptedAccountNumber: acc.encryptedAccountNumber,
                    accountNumberIv: acc.accountNumberIv,
                    encryptedIfsc: acc.encryptedIfsc,
                    ifscIv: acc.ifscIv
                };

                // Cleanup undefined
                Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

                await BankAccount.updateOne({ _id: acc._id }, { $set: updateData, $unset: { accountHolder: 1, accountNumber: 1, ifsc: 1 } });
                console.log(`Migrated BankAccount ${acc._id}`);
            }
        }

        // Addresses
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
            if (addr._doc.line2 && !addr.encryptedLine2) {
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
                    encryptedLine2: addr.encryptedLine2,
                    line2Iv: addr.line2Iv,
                    encryptedCity: addr.encryptedCity,
                    cityIv: addr.cityIv,
                    encryptedZipCode: addr.encryptedZipCode,
                    zipCodeIv: addr.zipCodeIv
                };

                Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

                await Address.updateOne({ _id: addr._id }, { $set: updateData, $unset: { line1: 1, line2: 1, city: 1, zipCode: 1 } });
                console.log(`Migrated Address ${addr._id}`);
            }
        }

        console.log('System Fix Complete.');
        process.exit(0);

    } catch (err) {
        console.error('System Fix Failed:', err);
        process.exit(1);
    }
};

fixSystem();
