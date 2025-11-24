// utils/orderUtils.js

export const calculateTotal = (items) => {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
};
export const calculateRewardPoints = (total) => {
  return Math.floor(total / 10); 
};
