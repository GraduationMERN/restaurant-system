// Calculate totals
export const calculateOrderTotals = (items, taxRate = 0.1, deliveryFee = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const totalAmount = subtotal + tax + deliveryFee - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

// Format cart items for order
export const formatCartItemsForOrder = (cartItems, productDetails) => {
  return cartItems.map(item => {
    const product = productDetails.find(p => p._id.toString() === item.productId.toString());
    return {
      productId: item.productId,
      name: product?.name || "Product",
      img: product?.imgURL || "",
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || {},
      price: item.price,
      itemPoints: product?.productPoints || 0
    };
  });
};
