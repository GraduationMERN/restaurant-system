import {getCartForUserRepo,addToCartRepo} from "../repositories/cart.repositorty.js"

export const getCartForUserService =async(userId)=>{
    return await getCartForUserRepo(userId)
}

export const addToCartService = async(userId)=>{
    return await addToCartRepo(userId)
}