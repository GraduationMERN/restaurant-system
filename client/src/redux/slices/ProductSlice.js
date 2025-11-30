import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";


// Fetch All Products
export const fetchProducts = createAsyncThunk(
    "products/fetchAll",
    async () => {
        const res = await api.get('/api/products');
        return res.data;
    }
);

//Fetch product by id
export const fetchProductById = createAsyncThunk(
    "products/fetchById",
    async (id) => {
        const res = await api.get(`/api/products/${id}`);
        return res.data;
    }
);

//Fetch new product 
export const fetchNewProducts  = createAsyncThunk(
    "products/getNew",
    async () => {
        const res = await api.get(`/api/products/new`);
        return res.data;
    }
);

//Fetch product (filtered, sorted, paginated)
export const fetchProductList = createAsyncThunk(
    "products/getList",
    async (params) => {
        // params ممكن تكون { searchTerm, categoryId, sortBy, sortOrder, page, pageSize }
        const res = await api.get(`/api/products/list`, { params });
        return res.data;
    }
);

//create product
export const createProduct = createAsyncThunk(
    "products/create",
    async (productData) => {
        const res = await api.post(`/api/products`, productData,{
                // withCredentials: true,      
                headers: { "Content-Type": "multipart/form-data" }
            });
        return res.data;
    }
)

//update product
export const updateProduct = createAsyncThunk(
    "products/update",
    async ({ id, productData }) => {
        const res = await api.put(`/api/products/${id}`, productData,{
                // withCredentials: true,      
                headers: { "Content-Type": "multipart/form-data" }
            });
        return res.data;
    }
)

//delete product
export const deleteProduct = createAsyncThunk(
    "products/delete",
    async (id) => {
        const res = await api.delete(`/api/products/${id}`, {
                // withCredentials: true,      
            });
        return res.data;
    }
);



const productSlice =createSlice({
    name: "product",
    initialState: {
        list: [],
        filtered: [],
        newProducts: [],
        single: null,
        loading: false,
        error: null,
        successMessage: null
    },
    reducers: {
        clearMessage(state){
            state.error = null;
            state.successMessage = null;
        },
        clearSingle(state) {
            state.single = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get All products
            .addCase(fetchProducts.pending, (state) => { state.loading = true })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Get single product
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.single = action.payload;
            })
            .addCase(fetchProductById.pending, (state) => { state.loading = true })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Get new products
            .addCase(fetchNewProducts.fulfilled,(state, action) => {
                state.newProducts = action.payload;
            })
            .addCase(fetchNewProducts.pending, (state) => { state.loading = true })
            .addCase(fetchNewProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Get filtered products
            .addCase(fetchProductList.fulfilled, (state, action) => {
                state.filtered = action.payload;
            })
            .addCase(fetchProductList.pending, (state) => { state.loading = true })
            .addCase(fetchProductList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // create product
            .addCase(createProduct.fulfilled,(state,action)=>{
                state.successMessage = "Product created successfully";
                state.list.push(action.payload);
            })
            .addCase(createProduct.pending, (state) => { state.loading = true })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // update product
            .addCase(updateProduct.fulfilled,(state,action)=>{
                state.successMessage = "Product updated successfully";
                state.list = state.list.map(p=>p._id === action.payload._id? action.payload : p);
                state.single = action.payload;
            })
            .addCase(updateProduct.pending, (state) => { state.loading = true })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })


            // delete product
            .addCase(deleteProduct.fulfilled,(state,action)=>{
                state.successMessage = "Product deleted successfully";
                state.list = state.list.filter(p=>p._id !== action.payload._id);
            })
            .addCase(deleteProduct.pending, (state) => { state.loading = true })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
    }
});

export const { clearMessage, clearSingle } = productSlice.actions;
export default productSlice.reducer;
