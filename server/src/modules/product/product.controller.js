import {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  getNewProductsService,
  getProductForListService,
} from "./product.service.js";
import { embeddingsModel } from "../../config/ai.js"; // for AI vector search

//getAllProducts
export const getAllProducts = async (req, res) => {
  try {
    const products = await getAllProductsService();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//getProductById
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductByIdService(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//createProduct
export const createProduct = async (req, res, next) => {
  try {
    const { name, desc, categoryId, stock, basePrice, options, productPoints } =
      req.body;
    if (
      !name ||
      !desc ||
      !req.file ||
      !categoryId ||
      !stock ||
      !basePrice ||
      !productPoints
    ) {
      return res
        .status(400)
        .json({
          message:
            "Name , desc , image , stock , basePrice, productPoints  and category are required",
        });
    }
    req.body.imgURL = req.file.path;
    if (options) {
      try {
        req.body.options = JSON.parse(options);
      } catch (err) {
        return res
          .status(400)
          .json({ message: "Options must be a valid JSON string" });
      }
    }

    // prepare embedding text safely
    const tags =
      req.body.tags ||
      (req.body.tagsString ? req.body.tagsString.split(",") : []);
    const text = `${name}. ${desc}. Tags: ${
      Array.isArray(tags) ? tags.join(",") : tags
    }. Price: ${basePrice}`;

    let embeddingProduct = [];
    try {
      embeddingProduct = await embeddingsModel.embedQuery(text);
    } catch (e) {
      // embedding failures should not block product creation; log and continue
      req?.log?.warn("embedding generation failed", {
        error: e?.message || String(e),
      });
    }

    const product = await createProductService({
      ...req.body,
      embedding: embeddingProduct,
    }); // storing embeddings for product for AI search
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
};

//updateProduct
export const updateProduct = async (req, res) => {
  try {
    if (req.file) {
      req.body.imgURL = req.file.path;
    }
    if (req.body.options) {
      try {
        req.body.options = JSON.parse(req.body.options);
      } catch (err) {
        return res
          .status(400)
          .json({ message: "Options must be a valid JSON string" });
      }
    }

    // Regenerate the embedding on every update, using the existing product as a
    // base so a partial update (e.g. price/image only) still ends up with an
    // up-to-date embedding instead of staying stuck at whatever it was created with.
    try {
      const existing = await getProductByIdService(req.params.id);
      if (existing) {
        const name = req.body.name ?? existing.name;
        const desc = req.body.desc ?? existing.desc;
        const basePrice = req.body.basePrice ?? existing.basePrice;
        const tags = req.body.tags ?? existing.tags ?? [];
        const text = `${name}. ${desc}. Tags: ${
          Array.isArray(tags) ? tags.join(",") : tags
        }. Price: ${basePrice}`;
        req.body.embedding = await embeddingsModel.embedQuery(text);
      }
    } catch (e) {
      req?.log?.warn("embedding regeneration failed", {
        error: e?.message || String(e),
      });
    }

    const product = await updateProductService(req.body, req.params.id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//deleteProduct
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await deleteProductService(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }
    res.status(200).json({ message: "product deleted successfully", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//getNewProducts
export const getNewProducts = async (req, res) => {
  try {
    const products = await getNewProductsService();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//getProductForList for pagination , sort ,filter
export const getProductForList = async (req, res) => {
  try {
    let { searchTerm, categoryId, sortBy, sortOrder, page, pageSize } =
      req.query;

    // Default values
    sortBy = sortBy || "price";
    sortOrder = sortOrder === "asc" ? 1 : -1;
    page = Number(page) || 1;
    pageSize = Number(pageSize) || 10;

    let queryFilter = {};

    //filter by searchTerm
    if (searchTerm && searchTerm !== "null") {
      queryFilter.$or = [
        // The regex pattern ensures it finds partial matches
        { name: { $regex: ".*" + searchTerm + ".*", $options: "i" } },
        { desc: { $regex: ".*" + searchTerm + ".*", $options: "i" } },
      ];
    }
    //filter by categoryId
    if (categoryId && categoryId !== "null") {
      queryFilter.categoryId = categoryId;
    }

    // find products
    const products = await getProductForListService(
      queryFilter,
      sortBy,
      sortOrder,
      page,
      pageSize
    );

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
