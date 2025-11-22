import express from "express";
const router = express.Router();
import {getCartForUser,addToCart,deleteProductFromCart,updateCartQuantity,clearCart} from "../controllers/cart.controller.js";


router.get('/:userId',getCartForUser);
router.post('/add',addToCart);
router.delete('/clear/:userId',clearCart);
router.delete('/:userId/:productId',deleteProductFromCart);
router.put('/:userId/:productId',updateCartQuantity);


export default router;