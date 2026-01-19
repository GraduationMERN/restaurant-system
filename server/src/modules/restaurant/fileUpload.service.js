// fileUpload.service.js
import restaurantRepository from "./restaurant.repository.js";
import { uploadBufferToCloudinary } from "./menuGenerator.service.js";

class FileUploadService {
  async _getUrlFromFile(file, folder = 'branding') {
    if (!file) throw new Error('No file provided');

    // If file already has a remote path (e.g., multer + cloudinary), use it
    if (file.path && typeof file.path === 'string') return file.path;

    // If middleware provides a buffer (multer.memoryStorage), upload it
    if (file.buffer) {
      try {
        const url = await uploadBufferToCloudinary(file.buffer, folder);
        return url;
      } catch (err) {
        console.error('uploadBufferToCloudinary error', err);
        throw err;
      }
    }

    // If file is provided as URL
    if (file.url) return file.url;

    throw new Error('Unsupported file object');
  }

  async uploadLogo(file) {
    try {
      const url = await this._getUrlFromFile(file, 'branding');
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) throw new Error('Restaurant not found');

      const updateData = { branding: { ...restaurant.branding, logoUrl: url } };
      const updated = await restaurantRepository.update(restaurant._id, updateData);
      console.log('Logo uploaded', url);
      return { url, restaurant: updated };
    } catch (err) {
      console.error('uploadLogo error', err);
      throw err;
    }
  }

  async uploadMenuImage(file) {
    try {
      const url = await this._getUrlFromFile(file, 'branding');
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) throw new Error('Restaurant not found');

      const updateData = { branding: { ...restaurant.branding, menuImage: url } };
      const updated = await restaurantRepository.update(restaurant._id, updateData);
      console.log('Menu image uploaded', url);
      return { url, restaurant: updated };
    } catch (err) {
      console.error('uploadMenuImage error', err);
      throw err;
    }
  }

  async uploadFavicon(file) {
    try {
      const url = await this._getUrlFromFile(file, 'branding');
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) throw new Error('Restaurant not found');

      const updateData = { branding: { ...restaurant.branding, faviconUrl: url } };
      const updated = await restaurantRepository.update(restaurant._id, updateData);
      console.log('Favicon uploaded', url);
      return { url, restaurant: updated };
    } catch (err) {
      console.error('uploadFavicon error', err);
      throw err;
    }
  }

  /**
   * Upload an image for the landing page. `targetPath` can be e.g. 'hero', 'about',
   * or a dot path like 'hero.image' to set a nested property under systemSettings.landing
   */
  async uploadLandingImage(targetPath, file) {
    try {
      const url = await this._getUrlFromFile(file, 'landing');
      const restaurant = await restaurantRepository.findOne();
      if (!restaurant) throw new Error('Restaurant not found');

      // Normalize target into object for updateSystemSettings
      // Accept 'hero' -> { landing: { hero: { image: url } } }
      // Accept 'hero.image' -> { landing: { hero: { image: url } } }
      const parts = String(targetPath || 'hero').split('.');
      const landingUpdate = parts.reduceRight((acc, key) => ({ [key]: acc }), url);
      const updates = { landing: landingUpdate };

      const updated = await restaurantRepository.updateSystemSettings(restaurant._id, updates);
      console.log('Landing image uploaded', targetPath, url);
      return { url, restaurant: updated };
    } catch (err) {
      console.error('uploadLandingImage error', err);
      throw err;
    }
  }
}

export default new FileUploadService();