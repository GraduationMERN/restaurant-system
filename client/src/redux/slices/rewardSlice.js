import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const getAllRewards = createAsyncThunk(
  "reward/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/reward");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const getRewardById = createAsyncThunk(
  "reward/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/reward/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const addReward = createAsyncThunk(
  "reward/add",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/reward`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const deleteReward = createAsyncThunk(
  "reward/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/reward/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const updateReward = createAsyncThunk(
  "reward/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/reward/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const redeemReward = createAsyncThunk(
  "reward/redeem",
  async ({ rewardId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/reward/redeem`, { rewardId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

export const updatePoints = createAsyncThunk(
  "reward/updatePoints",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/reward/user/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data.error);
    }
  }
);

const rejected = (state, action) => {
  state.loading = false;
  state.error = action.payload;
};

const fulfilled = (state, action) => {
  state.loading = false;
  state.reward = action.payload;
  // populate rewardById map for quick lookup
  state.rewardById = Array.isArray(action.payload)
    ? action.payload.reduce((acc, r) => ((acc[r._id] = r), acc), {})
    : state.rewardById;
  state.error = null;
};

const fulfilledById = (state, action) => {
  state.loading = false;
  const r = action.payload;
  state.rewardById = state.rewardById || {};
  if (r && r._id) state.rewardById[r._id] = r;
  state.error = null;
};

const fulfilledAdded = (state, action) => {
  state.loading = false;
  state.reward = state.reward ? [...state.reward, action.payload] : [action.payload];
  state.rewardById = state.rewardById || {};
  if (action.payload && action.payload._id) state.rewardById[action.payload._id] = action.payload;
  state.error = null;
};

const fulfilledDeleted = (state, action) => {
  state.loading = false;
  const id = action.payload;
  state.reward = state.reward ? state.reward.filter((r) => r._id !== id) : [];
  state.rewardById = state.rewardById || {};
  if (id && state.rewardById[id]) delete state.rewardById[id];
  state.error = null;
};

const fulfilledUpdated = (state, action) => {
  state.loading = false;
  const updated = action.payload;
  if (Array.isArray(state.reward)) {
    state.reward = state.reward.map((r) => (r._id === updated._id ? updated : r));
  }
  state.rewardById = state.rewardById || {};
  if (updated && updated._id) state.rewardById[updated._id] = updated;
  state.error = null;
};

const fulfilledRedeemed = (state, action) => {
  state.loading = false;
  state.lastRedemption = action.payload;
  state.error = null;
};

const fulfilledUpdatePoints = (state, action) => {
  state.loading = false;
  state.pointsUpdateResult = action.payload;
  state.error = null;
};

const pending = (state) => {
  state.loading = true;
  state.error = null;
};

const rewardSlice = createSlice({
  name: "reward",
  initialState: {
    reward: null,
    items: [],
    totalPrice: 0,
    rewardById: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllRewards.pending, pending)
      .addCase(getAllRewards.fulfilled, fulfilled)
      .addCase(getAllRewards.rejected, rejected)
      .addCase(getRewardById.pending, pending)
      .addCase(getRewardById.fulfilled, fulfilledById)
      .addCase(getRewardById.rejected, rejected)
      .addCase(addReward.pending, pending)
      .addCase(addReward.fulfilled, fulfilledAdded)
      .addCase(addReward.rejected, rejected)
      .addCase(deleteReward.pending, pending)
      .addCase(deleteReward.fulfilled, fulfilledDeleted)
      .addCase(deleteReward.rejected, rejected)
      .addCase(updateReward.pending, pending)
      .addCase(updateReward.fulfilled, fulfilledUpdated)
      .addCase(updateReward.rejected, rejected)
      .addCase(redeemReward.pending, pending)
      .addCase(redeemReward.fulfilled, fulfilledRedeemed)
      .addCase(redeemReward.rejected, rejected)
      .addCase(updatePoints.pending, pending)
      .addCase(updatePoints.fulfilled, fulfilledUpdatePoints)
      .addCase(updatePoints.rejected, rejected);
  },
});

export default rewardSlice.reducer;