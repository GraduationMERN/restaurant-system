import { useOrderState } from "./state/orderState";
export const useOrdersController = () => {
  const { orders, loading, error } = useOrderState();
  return { orders, loading, error };
};
