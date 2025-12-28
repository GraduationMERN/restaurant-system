// fileUpload.service.js
import restaurantRepository from "./restaurant.repository.js";
import { uploadBufferToCloudinary } from "./menuGenerator.service.js";

class FileUploadService {
  async uploadLogo(file) {
    if (!file) {
      throw new Error("No file provided");
    }

    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const url = file.path; // Cloudinary URL
    
    await restaurantRepository.update(restaurant._id, {
      branding: {
        ...restaurant.branding,
        logoUrl: url,
      },
    });

    return url;
  }

  async uploadMenuImage(file) {
    if (!file) {
      throw new Error("No file provided");
    }

    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const url = file.path;
    
    await restaurantRepository.update(restaurant._id, {
      branding: {
        ...restaurant.branding,
        menuImage: url,
      },
    });

    return url;
  }

  async uploadFavicon(file) {
    if (!file) {
      throw new Error("No file provided");
    }

    const restaurant = await restaurantRepository.findOne();
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const url = file.path;
    
    await restaurantRepository.update(restaurant._id, {
      branding: {
        ...restaurant.branding,
        faviconUrl: url,
      },
    });

    return url;
  }
}

export default new FileUploadService();