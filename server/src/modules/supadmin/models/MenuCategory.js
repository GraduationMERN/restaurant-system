import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  order: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'createdAt' } });

const MenuCategory = mongoose.models.MenuCategory || mongoose.model('MenuCategory', menuCategorySchema);
export default MenuCategory;
