import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import connectDB from '../src/config/db.js';
import Restaurant from '../src/modules/restaurant/restaurant.model.js';

(async () => {
  try {
    await connectDB();
    const r = await Restaurant.findOne({ slug: 'test-restaurant' }).lean();
    if (!r) {
      const byEmail = await Restaurant.findOne({ email: 'owner@test.com' }).lean();
      console.log(byEmail || 'No restaurant found');
    } else {
      console.log(r);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
