import express from 'express';
import admin from './src/config/firebaseAdmin.js';

const app = express();

// Test endpoint to verify Firebase admin is working
app.get('/api/test-firebase', async (req, res) => {
  try {
    // Get Firebase project info
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({
        status: 'Firebase Admin initialized',
        projectId: process.env.FIREBASE_PROJECT_ID,
        message: 'To test token verification, pass Authorization: Bearer <firebase-id-token>'
      });
    }

    // Try to verify the token
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return res.json({
        success: true,
        decoded,
        message: 'Token verified successfully'
      });
    } catch (verifyErr) {
      // Decode without verification to see what's in the token
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          return res.json({
            success: false,
            error: 'Invalid JWT format (expected 3 parts)',
            partsCount: parts.length
          });
        }
        
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return res.json({
          success: false,
          error: verifyErr.message,
          decodedPayload: decoded,
          message: 'Token format is valid JWT but verification failed'
        });
      } catch (parseErr) {
        return res.json({
          success: false,
          error: verifyErr.message,
          parseError: parseErr.message,
          message: 'Token is not valid JWT'
        });
      }
    }
  } catch (err) {
    res.json({
      error: err.message,
      stack: err.stack
    });
  }
});

app.listen(9000, () => {
  console.log('Test endpoint running at http://localhost:9000/api/test-firebase');
});
