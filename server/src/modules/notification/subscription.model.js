import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    endpoint: {
      type: String,
      required: true,
      unique: true
    },
    expirationTime: {
      type: Date,
      default: null
    },
    keys: {
      p256dh: String,
      auth: String
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
