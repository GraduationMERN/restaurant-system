import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  location: { type: String, default: 'Main Dining Area' },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
}, { timestamps: { createdAt: 'createdAt' } });

// Use unique collection name to avoid collision with tableBooking.Table
const RestaurantTable = mongoose.models.RestaurantTable || mongoose.model('RestaurantTable', tableSchema, 'restaurant_tables');
export default RestaurantTable;
