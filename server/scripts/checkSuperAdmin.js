import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import connectDB from '../src/config/db.js';
import User from '../src/modules/user/model/User.js';

(async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@platform.com', role: 'super_admin' }).lean();
    if (!user) {
      console.log('Super admin not found');
    } else {
      console.log('Super admin found:');
      console.log({ _id: user._id.toString(), email: user.email, role: user.role, createdAt: user.createdAt });
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
