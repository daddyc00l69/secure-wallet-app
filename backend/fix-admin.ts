import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const verifyAdmin = async () => {
    try {
        await mongoose.connect('mongodb+srv://hottel_user:EhHl2LJKFskg5rrl@daddycool.0dewsru.mongodb.net/?appName=DaddyCOOl');
        console.log('MongoDB Connected');

        const email = 'tushar0p.verify+1@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found!`);
            process.exit(1);
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        // Ensure role is manager/admin if needed
        // user.role = 'manager'; 

        await user.save();
        console.log(`SUCCESS: User ${email} has been manually verified!`);
        console.log('You can now login with password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyAdmin();
