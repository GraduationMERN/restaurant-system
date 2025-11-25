// src/modules/order.module/orderUtils.js
export const calculateOrderTotal = (items) => {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
};
