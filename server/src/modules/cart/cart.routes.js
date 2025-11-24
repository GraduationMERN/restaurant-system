import express from "express";
const router = express.Router();
import {getCartForUser,addToCart,deleteProductFromCart,updateCartQuantity,clearCart} from "./cart.controller.js";


router.get('/',getCartForUser);
router.post('/add',addToCart);
router.delete('/clear/',clearCart);
router.delete('/:productId',deleteProductFromCart);
router.put('/:productId',updateCartQuantity);


export default router;