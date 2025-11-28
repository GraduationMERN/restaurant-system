// src/features/order/data/orderApi.js
export const fetchOrders = async () => {
  // Mock data
  return [
    { id: 1, customer: "John Doe", status: "pending", total: 25.5 },
    { id: 2, customer: "Jane Smith", status: "preparing", total: 18.0 },
    { id: 3, customer: "Guest", status: "completed", total: 32.0 },
  ];
};
