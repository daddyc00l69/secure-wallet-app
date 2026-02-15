
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const createTestAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wallet_db');
        console.log('MongoDB Connected');

        // Test Admin Credentials
        const email = 'admin@test.app';
        const hashedPassword = await bcrypt.hash('admin123', 10);

        let user = await User.findOne({ email });

        if (user) {
            console.log(`Updating existing test admin: ${email}`);
            user.password = hashedPassword;
            user.role = 'admin';
            user.isVerified = true;
            user.username = 'Test Admin';
            user.otp = undefined;
            user.otpExpires = undefined;
        } else {
            console.log(`Creating new test admin: ${email}`);
            user = new User({
                username: 'Test Admin',
                email,
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
        }

        await user.save();
        console.log(`\nSUCCESS: Test Admin Ready!`);
        console.log(`Email: ${email}`);
        console.log(`Password: admin123`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTestAdmin();
