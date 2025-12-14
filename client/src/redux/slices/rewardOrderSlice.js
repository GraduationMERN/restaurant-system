import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const getAllRewardOrders = createAsyncThunk(
    "rewardOrders/getAll",
    async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            const res = await api.get(`/api/reward/reward-order?page=${page}&limit=${limit}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data.error);
        }
    }
);

export const updateRewardOrder = createAsyncThunk(
    "rewardOrders/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await api.patch(`/api/reward/reward-order/${id}`, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data.error);
        }
    }
);

export const deleteRewardOrder = createAsyncThunk(
    "rewardOrders/delete",
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/reward/reward-order/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data.error);
        }
    }
);

const slice = createSlice({
    name: 'rewardOrders',
    initialState: {
        items: [],
         pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        },
        loading: false,
        error: null,
    },
    reducers: {
        setLocalRewardOrderStatus(state, action) {
            const { id, status } = action.payload;
            state.items = state.items.map(it => it._id === id ? { ...it, status } : it);
        },
        optimisticDeleteRewardOrder(state, action) {
            const id = action.payload;
            state.items = state.items.filter(it => it._id !== id);
        },
        restoreRewardOrder(state, action) {
            const item = action.payload;
            state.items = [item, ...state.items];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllRewardOrders.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(getAllRewardOrders.fulfilled, (state, action) => { state.loading = false;state.items = action.payload.items;state.pagination = action.payload.pagination; })
            .addCase(getAllRewardOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(updateRewardOrder.fulfilled, (state, action) => {
                const updated = action.payload;
                state.items = state.items.map(it => it._id === updated._id ? updated : it);
            })
            .addCase(deleteRewardOrder.fulfilled, (state, action) => {
                state.items = state.items.filter(it => it._id !== action.payload);
            })
    }
});
export const { setLocalRewardOrderStatus, optimisticDeleteRewardOrder, restoreRewardOrder } = slice.actions;
export default slice.reducer;
