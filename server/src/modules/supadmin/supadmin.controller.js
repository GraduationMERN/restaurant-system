import logger from "../../utils/logger.js";
import Restaurant from "../restaurant/restaurant.model.js";
import RestaurantTable from "./models/Table.js";
import MenuCategory from "./models/MenuCategory.js";
import Invitation from "./models/Invitation.js";
import AuditLog from "./models/AuditLog.js";
import crypto from "crypto";
import { sendEmail } from "../../utils/Mailer.js";
import { env } from "../../config/env.js";

export const getDashboard = async (req, res) => {
  try {
    // basic platform stats
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ status: "active" });
    const trialRestaurants = await Restaurant.countDocuments({ status: "trial" });

    logger.info("supadmin_dashboard_view", { userId: req.user?._id });

    res.json({
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
    });
  } catch (err) {
    logger.error("supadmin_dashboard_error", { message: err.message });
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

export const listRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { restaurantName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.plan) {
      filter['subscription.plan'] = req.query.plan;
    }

    const [items, total] = await Promise.all([
      Restaurant.find(filter)
        .select('restaurantName email subscription status createdAt slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Restaurant.countDocuments(filter),
    ]);

    logger.info('supadmin_restaurants_list', { userId: req.user?._id, filter });

    res.json({ restaurants: items, total, page, limit });
  } catch (err) {
    logger.error("supadmin_restaurants_list_error", { message: err.message });
    res.status(500).json({ message: "Failed to list restaurants" });
  }
};

export const getRestaurant = async (req, res) => {
  try {
    const id = req.params.id;
    const restaurant = await Restaurant.findById(id).lean();
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    await AuditLog.create({ userId: req.user?._id, action: 'view_restaurant', resourceType: 'restaurant', resourceId: id, ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' });
    res.json({ restaurant });
  } catch (err) {
    logger.error('supadmin_get_restaurant_error', { message: err.message });
    res.status(500).json({ message: 'Failed to get restaurant' });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const updated = await Restaurant.findByIdAndUpdate(id, payload, { new: true }).lean();
    await AuditLog.create({ userId: req.user?._id, action: 'update_restaurant', resourceType: 'restaurant', resourceId: id, details: payload, ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' });
    res.json({ restaurant: updated });
  } catch (err) {
    logger.error('supadmin_update_restaurant_error', { message: err.message });
    res.status(500).json({ message: 'Failed to update restaurant' });
  }
};

export const suspendRestaurant = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Restaurant.findByIdAndUpdate(id, { status: 'suspended' }, { new: true }).lean();
    await AuditLog.create({ userId: req.user?._id, action: 'suspend_restaurant', resourceType: 'restaurant', resourceId: id, ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' });
    res.json({ restaurant: updated });
  } catch (err) {
    logger.error('supadmin_suspend_restaurant_error', { message: err.message });
    res.status(500).json({ message: 'Failed to suspend restaurant' });
  }
};

export const activateRestaurant = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Restaurant.findByIdAndUpdate(id, { status: 'active' }, { new: true }).lean();
    await AuditLog.create({ userId: req.user?._id, action: 'activate_restaurant', resourceType: 'restaurant', resourceId: id, ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' });
    res.json({ restaurant: updated });
  } catch (err) {
    logger.error('supadmin_activate_restaurant_error', { message: err.message });
    res.status(500).json({ message: 'Failed to activate restaurant' });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      contactEmail,
      contactPhone,
      contactName,
      address,
      subscriptionPlan = 'trial',
      slug,
      settings = {},
    } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({ message: 'Name and contactEmail are required' });
    }

    // 1. Create restaurant document
    const now = new Date();
    const expiresAt = subscriptionPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const restaurant = await Restaurant.create({
      restaurantName: name,
      email: contactEmail,
      phone: contactPhone || '',
      address: address || '',
      subscription: {
        plan: subscriptionPlan,
        status: 'active',
        expiresAt,
      },
      status: 'active',
      createdBy: req.user?._id || null,
      slug: slug || undefined,
      systemSettings: {
        general: {
          timezone: settings.timezone || 'UTC',
          currency: settings.currency || 'USD',
          language: settings.language || 'en',
        }
      }
    });

    const restaurantId = restaurant._id;

    // 2. Create 10 default tables
    const tableDocs = [];
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 5 ? 2 : 4;
      tableDocs.push({ restaurantId, tableNumber: String(i), name: `Table ${i}`, capacity, location: 'Main Dining Area', status: 'available' });
    }
    try {
      const created = await RestaurantTable.insertMany(tableDocs);
      logger.info(`Created ${created.length} tables`);
    } catch (tableErr) {
      logger.error('Table creation failed', { error: tableErr.message, fullError: tableErr });
    }

    // 3. Create 4 default menu categories
    const categories = [
      { name: 'Appetizers', order: 1 },
      { name: 'Main Course', order: 2 },
      { name: 'Desserts', order: 3 },
      { name: 'Drinks', order: 4 },
    ].map(c => ({ ...c, restaurantId }));
    await MenuCategory.insertMany(categories);

    // 4. Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const invite = await Invitation.create({
      restaurantId,
      email: contactEmail,
      token,
      role: 'owner',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // 5. Send invitation email
    try {
      const clientBase = env.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
      const inviteUrl = `${clientBase.replace(/\/+$/,'')}/invite/${token}`;
      const subject = `You're invited to manage ${name} on BrandBite`;
      const text = `You have been invited to manage the restaurant ${name}. Visit ${inviteUrl} to accept the invitation.`;
      const html = `
        <p>Hello ${contactName || ''},</p>
        <p>You have been invited to manage the restaurant <strong>${name}</strong>.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This link expires in 7 days.</p>
      `;

      await sendEmail(contactEmail, subject, text, html);
      logger.info('invitation_email_sent', { email: contactEmail, restaurantId, invitationId: invite._id });
    } catch (emailErr) {
      logger.error('invitation_email_failed', { message: emailErr.message, email: contactEmail, restaurantId });
      console.error('Failed to send invitation email:', emailErr);
    }

    // 6. Log the action in audit_logs
    await AuditLog.create({
      userId: req.user?._id,
      action: 'create_restaurant',
      resourceType: 'restaurant',
      resourceId: restaurantId,
      details: { name, contactEmail, subscriptionPlan },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    // 7. Return response
    res.status(201).json({ success: true, restaurantId: restaurantId.toString(), invitationToken: token, message: 'Restaurant created successfully' });
  } catch (err) {
    logger.error('supadmin_create_restaurant_error', { message: err.message });
    res.status(500).json({ message: 'Failed to create restaurant', error: err.message });
  }
};

