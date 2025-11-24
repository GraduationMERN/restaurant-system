import categoryModel from "./Category.js";

export const getAllCategoriesRepo = async () => {
    return await categoryModel.find();
}

export const getCategoryByIdRepo = async (id) => {
    return await categoryModel.findById(id);
}

export const addCategoryRepo = async (data) => {
    return await categoryModel.create(data);
}

export const updateCategoryRepo = async (id,data) => {
    return await categoryModel.findByIdAndUpdate(id,data,{new:true});
}

export const deleteCategoryRepo = async (id) => {
    return await categoryModel.findByIdAndDelete(id);
}
