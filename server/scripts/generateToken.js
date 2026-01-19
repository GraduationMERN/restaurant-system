import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import connectDB from '../src/config/db.js';
import User from '../src/modules/user/model/User.js';
import { createAccessToken } from '../src/utils/createAccessToken.js';

const run = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@platform.com' });
    if (!user) return console.error('Super admin not found');
    const token = createAccessToken(user);
    console.log(token);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
