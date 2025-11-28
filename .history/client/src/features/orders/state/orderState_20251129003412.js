// src/features/order/states/orderState.js
import { useState, useEffect } from "react";
import { getOrders } from "../services/orderService";

export const useOrderState = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  return { orders, loading, error };
};
