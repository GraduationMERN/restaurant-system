export const calculateOrderTotal = (items, taxRate = 0, deliveryFee = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  const totalAmount = subtotal + tax + deliveryFee - discount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};