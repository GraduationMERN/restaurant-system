import mongoose from "mongoose";

/**
 * formatCartItemsForOrder
 * @param {Array} cartProducts - array of cart items
 * @returns {Array} formatted order items
 */
export function formatCartItemsForOrder(cartProducts) {
  return cartProducts.map(cp => {
    const prod = cp.productId || {};
    const basePrice = prod.basePrice ?? 0;
    const itemPoints = prod.productPoints ?? 0;
    const quantity = cp.quantity ?? 1;

    let optionPrice = 0;
    if (cp.selectedOptions && prod.options && Array.isArray(prod.options)) {
      for (const [optName, choiceLabel] of Object.entries(cp.selectedOptions || {})) {
        const optDef = prod.options.find(o => o.name === optName);
        if (optDef && Array.isArray(optDef.choices)) {
          const choice = optDef.choices.find(c => c.label === choiceLabel);
          if (choice) optionPrice += (choice.priceDelta || 0);
        }
      }
    }

    const unitPrice = basePrice + optionPrice;
    const totalPrice = unitPrice * quantity;

    return {
      productId: prod._id ? new mongoose.Types.ObjectId(prod._id) : null,
      name: prod.name || cp.name || "",
      image: prod.imgURL || cp.image || "",
      quantity,
      selectedOptions: cp.selectedOptions || {},
      basePrice,
      optionPrice,
      price: unitPrice,    // price per unit
      totalPrice,          // total price for this item
      itemPoints: itemPoints * quantity
    };
  });
}

/**
 * calculateOrderTotals
 * Calculates subtotal, tax, delivery fee, discount, and totalAmount for an order
 * @param {Array} items - formatted order items
 * @param {Number} taxRate - e.g. 0.14 for 14%
 * @param {Number} deliveryFee
 * @param {Number} discount
 * @returns {Object} { subtotal, tax, deliveryFee, discount, totalAmount }
 */
export function calculateOrderTotals(items, taxRate = 0.14, deliveryFee = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const tax = parseFloat((subtotal * (taxRate || 0)).toFixed(2));
  const totalAmount = parseFloat((subtotal + tax + (deliveryFee || 0) - (discount || 0)).toFixed(2));

  return {
    subtotal,
    tax,
    deliveryFee: deliveryFee || 0,
    discount: discount || 0,
    totalAmount
  };
}

/**
 * generateOrderNumber
 
 * @returns {String} order number
 */
export function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `ORD${dateStr}${randomNum}`;
}
