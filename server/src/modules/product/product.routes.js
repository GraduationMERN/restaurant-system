import express from "express";
const router = express.Router();
import { createProduct, deleteProduct, getAllProducts, getNewProducts, getProductById, getProductForList, updateProduct } from "./product.controller.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

router.get('/list',getProductForList);
router.get('/new',getNewProducts);
router.get("/:id", getProductById);
router.get("/", getAllProducts);
router.post("/", authMiddleware, roleMiddleware('admin'), uploadCloud.single('productImage'), createProduct);
router.put("/:id", authMiddleware, roleMiddleware('admin'), uploadCloud.single('productImage'), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware('admin'), deleteProduct);

export default router;