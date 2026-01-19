import express from 'express';
import admin from '../config/firebaseAdmin.js';
import Invitation from '../modules/supadmin/models/Invitation.js';
import User from '../modules/user/model/User.js';
import Restaurant from '../modules/restaurant/restaurant.model.js';
import { createAccessToken, createRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validate token without consuming
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invitation.findOne({ token }).lean();
    if (!invite) return res.status(404).json({ message: 'Invitation not found' });
    if (invite.used) return res.status(400).json({ message: 'Invitation already used' });
    if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) return res.status(400).json({ message: 'Invitation expired' });

    const restaurant = await Restaurant.findById(invite.restaurantId).select('restaurantName').lean();

    logger.info('invitation_validated', { invitationId: invite._id, email: invite.email, restaurantId: invite.restaurantId });
    res.json({ valid: true, invitation: { email: invite.email, role: invite.role, restaurantId: invite.restaurantId }, restaurant });
  } catch (err) {
    logger.error('invitation_validate_error', { message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept invitation and create owner account (using Firebase Admin + existing JWT utilities)
router.post('/accept', async (req, res) => {
  try {
    const { token, name, email, password } = req.body;
    console.log('=== INVITE ACCEPT REQUEST ===');
    console.log('Received:', { token: token ? '***' : 'missing', name, email, password: password ? '***' : 'missing' });
    
    if (!token) {
      console.log('ERROR: Token required');
      return res.status(400).json({ message: 'Token required' });
    }

    const invite = await Invitation.findOne({ token });
    console.log('Invitation found:', !!invite);
    if (!invite) {
      console.log('ERROR: Invitation not found');
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    console.log('Invitation details:', { used: invite.used, expiresAt: invite.expiresAt });
    if (invite.used) {
      console.log('ERROR: Invitation already used');
      return res.status(400).json({ message: 'Invitation already used' });
    }
    if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
      console.log('ERROR: Invitation expired');
      return res.status(400).json({ message: 'Invitation expired' });
    }

    const ownerEmail = email || invite.email;
    if (!ownerEmail) {
      console.log('ERROR: Email required');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists with this email
    const existing = await User.findOne({ email: ownerEmail });
    if (existing) {
      console.log('ERROR: User already exists with email:', ownerEmail);
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    let firebaseUser;
    try {
      console.log('Creating Firebase user with email:', ownerEmail);
      // Create Firebase user with email and password
      firebaseUser = await admin.auth().createUser({
        email: ownerEmail,
        password: password || 'TempPassword123!', // Fallback if no password provided
        displayName: name || ''
      });
      console.log('Firebase user created:', firebaseUser.uid);
    } catch (firebaseErr) {
      console.error('Firebase error:', firebaseErr.code, firebaseErr.message);
      logger.error('firebase_user_creation_failed', { message: firebaseErr.message, email: ownerEmail, code: firebaseErr.code });
      if (firebaseErr.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'Email already exists in Firebase' });
      }
      if (firebaseErr.code === 'auth/weak-password') {
        return res.status(400).json({ message: 'Password is too weak. Please use at least 6 characters.' });
      }
      throw firebaseErr;
    }

    // Create MongoDB user linked to restaurant
    console.log('Creating MongoDB user');
    const user = await User.create({
      name: name || '',
      email: ownerEmail,
      firebaseUid: firebaseUser.uid,
      role: 'restaurant_owner',
      restaurantId: invite.restaurantId,
      isVerified: true
    });
    console.log('MongoDB user created:', user._id);

    // Mark invitation as used
    invite.used = true;
    await invite.save();
    console.log('Invitation marked as used');

    // Create access and refresh tokens using existing utilities
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    console.log('Tokens created and saved');

    logger.info('restaurant_owner_created_via_invitation', {
      userId: user._id,
      restaurantId: invite.restaurantId,
      email: ownerEmail,
      firebaseUid: firebaseUser.uid
    });

    console.log('=== INVITE ACCEPT SUCCESS ===');
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('=== INVITE ACCEPT ERROR ===');
    console.error('Full error:', err);
    logger.error('invitation_accept_error', { message: err.message, code: err.code });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
