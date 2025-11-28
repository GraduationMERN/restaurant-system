// src/features/order/orderController.js
// import { useOrderState } from "./states/orderState";
import { useOrderState } from "./state/orderState";
export const useOrdersController = () => {
  const { orders, loading, error } = useOrderState();
  return { orders, loading, error };
};
