import express from "express";
const router = express.Router();
import { getAllCategories ,getCategoryById,addCategory,updateCategory,deleteCategory} from "../controllers/category.controller.js";

import { uploadCloud } from "../middlewares/uploadCloudinary.middleware.js";

router.get("/", getAllCategories);
router.get('/:id',getCategoryById);
router.post('/',uploadCloud.single('categoryImage'),addCategory);
router.put('/:id',uploadCloud.single('categoryImage'),updateCategory);
router.delete('/:id',deleteCategory)
export default router;