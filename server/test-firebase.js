import admin from './src/config/firebaseAdmin.js';
import { env } from './src/config/env.js';

console.log('Firebase Admin Initialized');
console.log('Project ID:', env.firebaseprojectId);
console.log('Client Email:', env.firebaseClientEmail);

// Try to decode a sample token (will fail but shows if admin is working)
const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYnJhbmRiaXRlLWJiNDNhIiwibmFtZSI6IlRlc3QgVXNlciIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9icmFuZGJpdGUtYmI0M2EiLCJhdWQiOiJicmFuZGJpdGUtYmI0M2EiLCJhdXRoX3RpbWUiOjEsInVzZXJfaWQiOiJ0ZXN0IiwiInN1YiI6InRlc3QiLCJpYXQiOjEsImV4cCI6OTk5OTk5OTk5OSwibWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMjM0NTY3ODkwIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.test';

console.log('\nTrying to verify test token (will fail as expected):');
admin.auth().verifyIdToken(testToken)
  .then(decoded => console.log('Token verified:', decoded))
  .catch(err => console.log('Expected error:', err.message));
