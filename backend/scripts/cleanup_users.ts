
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cleanupUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wallet_db');
        console.log('MongoDB Connected');

        const adminEmail = 'tushar0p.verify+1@gmail.com';

        const result = await User.deleteMany({ email: { $ne: adminEmail } });
        console.log(`Deleted ${result.deletedCount} users. Kept: ${adminEmail}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupUsers();
