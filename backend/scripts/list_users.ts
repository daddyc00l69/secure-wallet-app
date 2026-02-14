
import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wallet_db').then(async () => {
    const users = await User.find({}, 'email username role');
    console.log('Remaining Users:', users);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
