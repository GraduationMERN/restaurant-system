import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import connectDB from '../src/config/db.js';
import { createRestaurant } from '../src/modules/supadmin/supadmin.controller.js';
import mongoose from 'mongoose';

const run = async () => {
  try {
    await connectDB();

    const req = {
      body: {
        name: 'Direct Test Restaurant',
        contactEmail: 'direct-owner@test.com',
        contactPhone: '+19999999999',
        contactName: 'Direct Owner',
        address: '456 Direct St',
        subscriptionPlan: 'trial',
        slug: 'direct-test-restaurant',
        settings: { timezone: 'UTC', currency: 'USD', language: 'en' }
      },
      user: { _id: mongoose.Types.ObjectId('695ebe81841a3bcea729f0af') },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'cli-test' }
    };

    const res = {
      status(code) {
        this._status = code; return this;
      },
      json(payload) {
        console.log('RES STATUS:', this._status || 200);
        console.log(JSON.stringify(payload, null, 2));
        return payload;
      }
    };

    await createRestaurant(req, res);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
