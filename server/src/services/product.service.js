import { getAll,getProductById,createProduct } from "../repositories/product.repository.js";

export const getAllProductsService = async () => {
    return await getAll();
}

export const getProductByIdService = async (id) => {
    return await getProductById(id);
}

export const createProductService = async (productData) => {
    return await createProduct(productData);
}