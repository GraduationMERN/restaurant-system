import productModel from '../models/Product.js';

export const getAll = async () => {
    return await productModel.find();
}

export const getProductById = async (id) => {
    return await productModel.findById(id);
}

export const createProduct = async (productData) => {
    return await productModel.create(productData);
}
