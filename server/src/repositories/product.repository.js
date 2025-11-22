import productModel from '../models/Product.js';

export const getAll = async () => {
    return await productModel.find().populate('categoryId','name');
}

export const getProductById = async (id) => {
    return await productModel.findById(id);
}

export const createProduct = async (productData) => {
    return await productModel.create(productData);
}

export const updateProduct = async (productData,id) => {
    return await productModel.findByIdAndUpdate(id,productData,{new:true});
}

export const deleteProduct = async (id) => {
    return await productModel.findByIdAndDelete(id);
}

export const getNewProducts = async () => {
    return await productModel.find().sort({ createdAt: -1 }).limit(5);
}

export const getProductForList = async (queryFilter, sortBy, sortOrder, page, pageSize) => {
    return await productModel.find(queryFilter)
            .sort({ [sortBy]: +sortOrder })  
            .skip((page - 1) * pageSize)
            .limit(pageSize);
}