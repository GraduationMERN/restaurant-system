import {getAllCategoriesRepo,getCategoryByIdRepo,addCategoryRepo,updateCategoryRepo,deleteCategoryRepo} from "../repositories/category.repository.js";

export const getAllCategoriesService = async () => {
    return await getAllCategoriesRepo();
}

export const getCategoryByIdService = async (id) => {
    return await getCategoryByIdRepo(id);
}

export const addCategoryService = async (data) => {
    return await addCategoryRepo(data);
}

export const updateCategoryService = async (id,data) => {
    return await updateCategoryRepo(id,data);
}

export const deleteCategoryService = async (id) => {
    return await deleteCategoryRepo(id);
}