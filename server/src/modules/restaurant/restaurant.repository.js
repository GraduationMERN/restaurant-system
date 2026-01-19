// restaurant.repository.js
import Restaurant from "./restaurant.model.js";

class RestaurantRepository {
  // ======================
  // BASIC CRUD OPERATIONS
  // ======================
  
  // Find single restaurant (since you have only one)
  async findOne(filter = {}, { projection = null, populate = null } = {}) {
    try {
      // Accept flexible selectors: { restaurantId } or { subdomain } or arbitrary mongo filter
      let queryFilter = {};
      if (filter.restaurantId) {
        queryFilter.restaurantId = filter.restaurantId;
      } else if (filter.subdomain) {
        queryFilter = { 'websiteDesign.domain.subdomain': filter.subdomain, ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}) };
      } else {
        // allow passing raw filter object
        queryFilter = typeof filter === 'object' && Object.keys(filter).length ? filter : {};
      }

      let query = Restaurant.findOne(queryFilter, projection);
      if (populate) query = query.populate(populate);
      const restaurant = await query.exec();
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    } catch (err) {
      console.error('findOne error', err);
      throw err;
    }
  }

  // Find restaurant by ID
  async findById(id, { populate = null } = {}) {
    try {
      let query = Restaurant.findById(id);
      if (populate) query = query.populate(populate);
      const restaurant = await query.exec();
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      return restaurant;
    } catch (err) {
      console.error('findById error', err);
      throw err;
    }
  }

  // Find restaurant by subdomain
  async findBySubdomain(subdomain) {
    try {
      const restaurant = await Restaurant.findOne({
        "websiteDesign.domain.subdomain": subdomain,
        isActive: true,
      });
      if (!restaurant) {
        throw new Error("Restaurant not found or inactive");
      }
      return restaurant;
    } catch (err) {
      console.error('findBySubdomain error', err);
      throw err;
    }
  }

  // Find by restaurantId (external identifier)
  async findByRestaurantId(restaurantId, { projection = null, populate = null } = {}) {
    try {
      let query = Restaurant.findOne({ restaurantId }, projection);
      if (populate) query = query.populate(populate);
      const restaurant = await query.exec();
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    } catch (err) {
      console.error('findByRestaurantId error', err);
      throw err;
    }
  }

  // Find all restaurants (filtering & pagination)
  async findAll({ filter = {}, page = 1, limit = 20, sort = { createdAt: -1 }, projection = null } = {}) {
    try {
      const skip = Math.max(0, (page - 1)) * limit;
      const query = Restaurant.find(filter, projection).sort(sort).skip(skip).limit(limit);
      const [items, total] = await Promise.all([query.exec(), Restaurant.countDocuments(filter)]);
      return { items, total, page, limit };
    } catch (err) {
      console.error('findAll error', err);
      throw err;
    }
  }

  // Update restaurant
  async update(id, updateData) {
    try {
      // If updateData contains atomic operators, pass directly
      const hasOperator = Object.keys(updateData || {}).some(k => k.startsWith('$'));
      if (hasOperator) {
        const restaurant = await Restaurant.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!restaurant) throw new Error('Restaurant not found');
        return restaurant;
      }

      // Otherwise perform a merge to avoid overwriting nested objects unintentionally
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) throw new Error('Restaurant not found');

      const mergeDeep = (target, source) => {
        for (const key of Object.keys(source)) {
          const srcVal = source[key];
          if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) && !(srcVal instanceof Date)) {
            if (!target[key]) target[key] = {};
            mergeDeep(target[key], srcVal);
          } else {
            target[key] = srcVal;
          }
        }
      };

      mergeDeep(restaurant, updateData);
      await restaurant.save();
      return restaurant;
    } catch (err) {
      console.error('update error', err);
      throw err;
    }
  }

  // Update only systemSettings (atomic update using dot notation)
  async updateSystemSettings(id, updates = {}) {
    try {
      const setObj = {};
      const flatten = (obj, prefix = 'systemSettings') => {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const path = `${prefix}.${key}`;
          if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
            flatten(val, path);
          } else {
            setObj[path] = val;
          }
        }
      };

      flatten(updates, 'systemSettings');
      if (Object.keys(setObj).length === 0) {
        throw new Error('No systemSettings updates provided');
      }

      const restaurant = await Restaurant.findByIdAndUpdate(id, { $set: setObj }, { new: true, runValidators: true });
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    } catch (err) {
      console.error('updateSystemSettings error', err);
      throw err;
    }
  }

  // Update restaurant directly (without ID) - accepts optional selector
  async updateRestaurant(updateData, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      // Reuse the merge strategy used in update() to avoid overwriting nested objects
      const mergeDeep = (target, source) => {
        for (const key of Object.keys(source)) {
          const srcVal = source[key];
          if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) && !(srcVal instanceof Date)) {
            if (!target[key]) target[key] = {};
            mergeDeep(target[key], srcVal);
          } else {
            target[key] = srcVal;
          }
        }
      };

      mergeDeep(restaurant, updateData);
      await restaurant.save();
      return restaurant;
    } catch (err) {
      console.error('updateRestaurant error', err);
      throw err;
    }
  }

  // ======================
  // ARRAY OPERATIONS
  // ======================
  
  // Add to array (paymentMethods, faqs)
  async addToArray(arrayField, item, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      if (!Array.isArray(restaurant[arrayField])) restaurant[arrayField] = [];
      restaurant[arrayField].push(item);
      restaurant.markModified(arrayField);
      await restaurant.save();
      return restaurant[arrayField];
    } catch (err) {
      console.error('addToArray error', { arrayField, err });
      throw err;
    }
  }

  // Remove from array by index
  async removeFromArrayByIndex(arrayField, index, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      if (!Array.isArray(restaurant[arrayField])) throw new Error(`Field ${arrayField} is not an array`);
      if (index < 0 || index >= restaurant[arrayField].length) throw new Error(`Invalid index for ${arrayField}: ${index}`);

      restaurant[arrayField].splice(index, 1);
      restaurant.markModified(arrayField);
      await restaurant.save();
      return restaurant[arrayField];
    } catch (err) {
      console.error('removeFromArrayByIndex error', { arrayField, index, err });
      throw err;
    }
  }

  // Remove from array by ID (for FAQs which have _id)
  async removeFromArrayById(arrayField, itemId, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      if (!Array.isArray(restaurant[arrayField])) throw new Error(`Field ${arrayField} is not an array`);

      const initialLength = restaurant[arrayField].length;
      restaurant[arrayField] = restaurant[arrayField].filter(item => {
        try {
          return item._id.toString() !== itemId;
        } catch (e) {
          return true;
        }
      });

      if (restaurant[arrayField].length === initialLength) throw new Error(`Item not found in ${arrayField}: ${itemId}`);

      restaurant.markModified(arrayField);
      await restaurant.save();
      return restaurant[arrayField];
    } catch (err) {
      console.error('removeFromArrayById error', { arrayField, itemId, err });
      throw err;
    }
  }

  // Update item in array by index
  async updateInArrayByIndex(arrayField, index, updates, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      if (!Array.isArray(restaurant[arrayField])) throw new Error(`Field ${arrayField} is not an array`);
      if (index < 0 || index >= restaurant[arrayField].length) throw new Error(`Invalid index for ${arrayField}: ${index}`);

      restaurant[arrayField][index] = { ...restaurant[arrayField][index], ...updates };
      restaurant.markModified(arrayField);
      await restaurant.save();
      return restaurant[arrayField][index];
    } catch (err) {
      console.error('updateInArrayByIndex error', { arrayField, index, err });
      throw err;
    }
  }

  // Update item in array by ID (for FAQs)
  async updateInArrayById(arrayField, itemId, updates, selector = {}) {
    try {
      const restaurant = await this.findOne(selector);
      if (!restaurant) throw new Error('Restaurant not found');

      if (!Array.isArray(restaurant[arrayField])) throw new Error(`Field ${arrayField} is not an array`);

      const itemIndex = restaurant[arrayField].findIndex(item => {
        try { return item._id.toString() === itemId; } catch (e) { return false; }
      });

      if (itemIndex === -1) throw new Error(`Item not found in ${arrayField}: ${itemId}`);

      const existing = restaurant[arrayField][itemIndex];
      const base = (existing && typeof existing.toObject === 'function') ? existing.toObject() : { ...existing };
      restaurant[arrayField][itemIndex] = { ...base, ...updates };

      restaurant.markModified(arrayField);
      await restaurant.save();
      return restaurant[arrayField][itemIndex];
    } catch (err) {
      console.error('updateInArrayById error', { arrayField, itemId, err });
      throw err;
    }
  }

  // Find index in array by identifier
  async findIndexInArray(arrayField, identifier, value, selector = {}) {
    const restaurant = await this.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');
    if (!Array.isArray(restaurant[arrayField])) return -1;
    return restaurant[arrayField].findIndex(item => item[identifier] === value);
  }

  // Find item in array by ID
  async findInArrayById(arrayField, itemId, selector = {}) {
    const restaurant = await this.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');
    if (!Array.isArray(restaurant[arrayField])) return null;
    return restaurant[arrayField].find(item => {
      try { return item._id.toString() === itemId; } catch (e) { return false; }
    }) || null;
  }

  // ======================
  // UTILITY METHODS
  // ======================
  
  // Get restaurant ID
  async getRestaurantId(selector = {}) {
    const restaurant = await this.findOne(selector);
    if (!restaurant) throw new Error('Restaurant not found');
    return restaurant._id;
  }

  // Check if restaurant exists
  async exists() {
    const count = await Restaurant.countDocuments();
    return count > 0;
  }

  // Create initial restaurant (if doesn't exist)
  async createInitial(restaurantData) {
    const exists = await this.exists();
    if (exists) {
      throw new Error("Restaurant already exists");
    }
    
    const restaurant = new Restaurant(restaurantData);
    return await restaurant.save();
  }
}

export default new RestaurantRepository();