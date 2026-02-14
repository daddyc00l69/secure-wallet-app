import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const promoteAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        const email = 'tushar0p.verify+1@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`User ${user.username} (${user.email}) is now an ADMIN.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

promoteAdmin();
