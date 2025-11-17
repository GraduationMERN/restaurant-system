import express from "express";
const router = express.Router();
import { createProduct, deleteProduct, getAllProducts, getNewProducts, getProductById, getProductForList, updateProduct } from "../controllers/product.controller.js";
import { uploadCloud } from "../middlewares/uploadCloudinary.middleware.js";

router.get('/list',getProductForList);
router.get('/new',getNewProducts);
router.get("/:id", getProductById);
router.get("/", getAllProducts);
router.post("/",uploadCloud.single('productImage'),createProduct);
router.put("/:id",uploadCloud.single('productImage'),updateProduct);
router.delete("/:id",deleteProduct);

export default router;