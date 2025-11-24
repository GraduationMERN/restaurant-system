import { getAll,getProductById,createProduct,updateProduct,deleteProduct,getNewProducts,getProductForList} from "./product.repository.js";

export const getAllProductsService = async () => {
    return await getAll();
}

export const getProductByIdService = async (id) => {
    return await getProductById(id);
}

export const createProductService = async (productData) => {
    return await createProduct(productData);
}

export const updateProductService = async (productData,id) => {
    return await updateProduct(productData,id);
}

export const deleteProductService = async (id) => {
    return await deleteProduct(id);
}

export const getNewProductsService = async () => {
    return await getNewProducts();
}

export const getProductForListService = async (queryFilter, sortBy, sortOrder, page, pageSize) => {
    return await getProductForList(queryFilter, sortBy, sortOrder, page, pageSize);
}