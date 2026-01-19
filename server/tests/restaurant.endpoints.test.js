import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { strict as assert } from 'assert';

let app;
import Restaurant from '../src/modules/restaurant/restaurant.model.js';

let mongod;

before(async function() {
  this.timeout(20000);
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';

  await mongoose.connect(uri, { dbName: 'test' });

  // create initial restaurant doc
  await Restaurant.create({ restaurantName: 'Test Restaurant', restaurantId: 'test-1', paymentMethods: [], faqs: [] });

  // Import app after env is set
  app = (await import('../app.js')).default;
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Restaurant endpoints (uploads, payments, faqs)', function() {
  this.timeout(10000);

  it('uploads logo using test header', async () => {
    const testUrl = 'https://example.com/logo.png';
    const res = await request(app)
      .post('/api/restaurant/upload-logo')
      .set('x-test-file-url', testUrl)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.logoUrl, testUrl);
  });

  it('adds a payment method', async () => {
    const pm = { name: 'Test Pay', type: 'card', enabled: true };
    const res = await request(app)
      .post('/api/restaurant/payment-methods')
      .send(pm)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    const found = res.body.data.find(p => p.name === 'Test Pay');
    assert.ok(found, 'Payment method added');
  });

  it('adds an FAQ and updates it', async () => {
    const faq = { question: 'Q1', answer: 'A1' };
    const addRes = await request(app)
      .post('/api/restaurant/faqs')
      .send(faq)
      .expect(201);

    assert.equal(addRes.body.success, true);
    const added = addRes.body.data;
    assert.equal(added.question, faq.question);

    const updatedRes = await request(app)
      .put(`/api/restaurant/faqs/${added._id}`)
      .send({ answer: 'A1-updated' })
      .expect(200);

    assert.equal(updatedRes.body.success, true);
    assert.equal(updatedRes.body.data.answer, 'A1-updated');

    const removeRes = await request(app)
      .delete(`/api/restaurant/faqs/${added._id}`)
      .expect(200);

    assert.equal(removeRes.body.success, true);
    assert.ok(Array.isArray(removeRes.body.data));
  });
});
