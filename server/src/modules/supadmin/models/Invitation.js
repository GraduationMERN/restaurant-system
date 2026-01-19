import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  role: { type: String, enum: ['owner'], default: 'owner' },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt' } });

const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);
export default Invitation;
