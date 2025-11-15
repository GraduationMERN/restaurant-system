import express from "express";
const router = express.Router();
import { createProduct, getAllProducts, getProductById } from "../controllers/product.controller.js";
import { uploadCloud } from "../middlewares/uploadCloudinary.middleware.js";


router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/",uploadCloud.single('productImage'),createProduct);


export default router;