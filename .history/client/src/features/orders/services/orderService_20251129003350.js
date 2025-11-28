// src/features/order/services/orderService.js
import { fetchOrders } from "../data/orderApi";

export const getOrders = async () => {
  try {
    const orders = await fetchOrders();
    return orders;
  } catch (err) {
    throw new Error("Failed to fetch orders");
  }
};
