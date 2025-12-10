import cartModel from './Cart.js';

export const getCartForUserRepo=async(userId)=>{
    return await cartModel.findOne({userId}).populate('products.productId');
}

export const addToCartRepo = async(userId)=>{
    return await cartModel.findOne({ userId });
}