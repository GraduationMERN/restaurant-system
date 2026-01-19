import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import fetch from 'node-fetch';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node createTestRestaurant.js <JWT_TOKEN>');
  process.exit(1);
}

const body = {
  name: 'Test Restaurant',
  contactEmail: 'owner@test.com',
  contactPhone: '+100000000',
  contactName: 'Owner Name',
  address: '123 Main St',
  subscriptionPlan: 'trial',
  slug: 'test-restaurant',
  settings: { timezone: 'UTC', currency: 'USD', language: 'en' }
};

(async () => {
  try {
    const res = await fetch('http://localhost:8000/api/supadmin/restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log(data);
  } catch (err) {
    console.error(err);
  }
})();
