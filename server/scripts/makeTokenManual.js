import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const payload = {
  id: '695ebe81841a3bcea729f0af',
  name: 'Platform Super Admin',
  role: 'super_admin',
  email: 'admin@platform.com'
};

const secret = process.env.JWT_SECRET || process.env.JWT_KEY || process.env.jwtKey;
if (!secret) {
  console.error('Missing JWT secret in environment');
  process.exit(1);
}

const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log(token);
