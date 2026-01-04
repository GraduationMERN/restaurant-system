import Cart from "./Cart.js";
import { getCartForUserService, addToCartService } from "./cart.service.js";
import { getProductByIdService } from "../product/product.service.js";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env.js";

const isProduction = env.nodeEnv === "production";
// Helper function to populate cart with product details including productPoints
async function populateCartWithProductPoints(cart) {
  if (!cart || !cart.products || cart.products.length === 0) return cart;

  const populatedCart = await cart.populate('products.productId');
  return populatedCart;
}


function getCartUserId(req, res) {
  if (req.user?._id) {
    return req.user._id.toString();
  }
  let guestId = req.cookies.guestCartId;

  if (!guestId) {
    guestId = uuidv4();
    // console.log(" No guestCartId found → Generating:", guestId);

    res.cookie("guestCartId", guestId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction, // ← works on both
      path: "/",
    });
  } else {
    console.log("Existing guestCartId found:", guestId);
  }
  return guestId;
}


//getCartForUser
export const getCartForUser = async (req, res) => {
  try {
    const userId = getCartUserId(req, res);
    let cart = await getCartForUserService(userId);
    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
        totalPrice: 0,
      });
      await cart.save();
    }
    if (req.cookies.guestCartId && req.user?._id) {
      const guestCart = await getCartForUserService(req.cookies.guestCartId);
      if (guestCart) {
        guestCart.products.forEach(guestProduct => {
          // Normalize selectedOptions to handle undefined/null/empty cases
          const guestOptions = JSON.stringify(guestProduct.selectedOptions || {});

          const existingProductIndex = cart.products.findIndex(
            p => {
              const existingOptions = JSON.stringify(p.selectedOptions || {});
              return p.productId.toString() === guestProduct.productId.toString() &&
                existingOptions === guestOptions;
            }
          );

          if (existingProductIndex > -1) {
            cart.products[existingProductIndex].quantity += guestProduct.quantity;
          } else {
            cart.products.push({
              ...guestProduct,
              selectedOptions: guestProduct.selectedOptions || {}
            });
          }
        });

        cart.totalPrice = cart.products.reduce(
          (sum, p) => sum + p.price * p.quantity,
          0
        );
        await cart.save();
        await Cart.findByIdAndDelete(guestCart._id);

        // Clear the guest cookie after successful merge
        res.clearCookie('guestCartId');
      }
    }
    // Populate with product details to include productPoints
    cart = await populateCartWithProductPoints(cart);
    cart.products = cart.products.map(product => ({
      ...product.toObject(),
      selectedOptions: product.selectedOptions || {}
    }));
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function calculateFinalPrice(product, selectedOptions) {
  let total = product.basePrice;

  // ✅ FIX: Check if product has options first
  if (product.options && product.options.length > 0 && selectedOptions) {
    product.options.forEach((opt) => {
      const userChoice = selectedOptions[opt.name];
      if (!userChoice) return;

      const choiceData = opt.choices.find((c) => c.label === userChoice);
      if (choiceData) {
        total += choiceData.priceDelta;
      }
    });
  }

  return total;
}

// add to cart
export const addToCart = async (req, res) => {
  try {
    const userId = getCartUserId(req, res);
    const { productId, quantity, selectedOptions } = req.body;

    let cart = await addToCartService(userId);
    const product = await getProductByIdService(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ FIX: Check if product has NO options or empty options array
    const hasOptions = product.options && product.options.length > 0;

    if (!hasOptions) {
      // المنتج مفيهوش اختيارات → استخدام stock العام
      if (quantity > product.stock) {
        return res
          .status(400)
          .json({ message: "Requested quantity exceeds available stock" });
      }
      if (product.stock <= 0) {
        return res.status(400).json({ message: "Product is out of stock" });
      }
    }

    // ✅ FIX: Only validate options if product actually has options
    if (hasOptions && selectedOptions) {
      for (let opt of product.options) {
        const choiceName = selectedOptions[opt.name];
        if (!choiceName) {
          if (opt.required) {
            return res
              .status(400)
              .json({ message: `Option "${opt.name}" is required` });
          }
          continue;
        }

        const choiceData = opt.choices.find((c) => c.label === choiceName);
        if (!choiceData) {
          return res
            .status(400)
            .json({ message: `Invalid choice for option "${opt.name}"` });
        }

        if (choiceData.stock !== null && quantity > choiceData.stock) {
          return res
            .status(400)
            .json({
              message: `Not enough stock for option "${opt.name}" (${choiceName})`,
            });
        }
      }
    }

    const finalPrice = calculateFinalPrice(product, selectedOptions);

    // if first time -> create new cart
    if (!cart) {
      cart = new Cart({
        userId,
        products: [
          {
            productId,
            quantity,
            selectedOptions: selectedOptions || {},
            price: finalPrice,
          },
        ],
        totalPrice: finalPrice * quantity,
      });
    } else {
      // نشوف المنتج موجود بنفس الخيارات ولا لأ
      const productInCart = cart.products.find(
        (p) =>
          p.productId.toString() === productId &&
          JSON.stringify(p.selectedOptions) ===
          JSON.stringify(selectedOptions || {})
      );

      if (productInCart) {
        // لو المنتج مفيهوش اختيارات → شيك على stock العام
        if (!hasOptions) {
          if (productInCart.quantity + quantity > product.stock) {
            return res
              .status(400)
              .json({ message: "Not enough stock for this quantity" });
          }
        } else {
          // المنتج ليه options → شيك على stock الخاص بالاختيارات
          for (let opt of product.options) {
            const choiceName = selectedOptions[opt.name];
            if (!choiceName) continue;

            const choiceData = opt.choices.find((c) => c.label === choiceName);
            if (choiceData && choiceData.stock !== null) {
              if (productInCart.quantity + quantity > choiceData.stock) {
                return res.status(400).json({
                  message: `Not enough stock for option "${opt.name}" (${choiceName})`,
                });
              }
            }
          }
        }

        // هنا لازم تزودي الكمية
        productInCart.quantity += quantity;
        cart.totalPrice += finalPrice * quantity;
      } else {
        // منتج جديد
        cart.products.push({
          productId,
          quantity,
          selectedOptions: selectedOptions || {},
          price: finalPrice,
        });
        cart.totalPrice += finalPrice * quantity;
      }
    }

    // ✅ FIX: Update stock based on whether product has options
    if (!hasOptions) {
      product.stock -= quantity;
    } else if (selectedOptions) {
      for (let opt of product.options) {
        const choiceName = selectedOptions[opt.name];
        if (!choiceName) continue;

        const choiceData = opt.choices.find((c) => c.label === choiceName);
        if (choiceData && choiceData.stock !== null) {
          choiceData.stock -= quantity;
        }
      }
    }

    await product.save();
    await cart.save();

    // Populate with product details to include productPoints
    const populatedCart = await populateCartWithProductPoints(cart);
    populatedCart.products = populatedCart.products.map(product => ({
      ...product.toObject(),
      selectedOptions: product.selectedOptions || {}
    }));

    res.status(201).json(populatedCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// delete product from cart
export const deleteProductFromCart = async (req, res) => {
  try {
    const userId = getCartUserId(req, res);
    const { productId } = req.params;

    // Get user cart
    let cart = await getCartForUserService(userId);
    // if (!cart) {
    //     return res.status(404).json({ message: 'Cart not found' });
    // }
    // لو الكارت مش موجود → ننشئ واحدة فارغة
    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
        totalPrice: 0,
      });
      await cart.save();
    }

    // Check product exists in cart
    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId._id.toString() === productId ||
        p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const cartItem = cart.products[productIndex];
    const product = await getProductByIdService(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found in DB" });
    }

    const quantity = cartItem.quantity;
    const finalPrice = cartItem.price;
    const selectedOptions = cartItem.selectedOptions;

    // Update total price
    cart.totalPrice -= finalPrice * quantity;

    // ---------------------------------------
    // ❗ RETURN STOCK
    // ---------------------------------------

    // ✅ FIX: Check if product has options
    const hasOptions = product.options && product.options.length > 0;

    // Case 1: Product with NO options → return general stock
    if (!hasOptions) {
      product.stock += quantity;
    }

    // Case 2: Product WITH options → return stock to EACH selected choice
    if (hasOptions && selectedOptions) {
      for (let opt of product.options) {
        const selectedChoice = selectedOptions[opt.name];
        if (!selectedChoice) continue;

        const choiceObj = opt.choices.find((c) => c.label === selectedChoice);
        if (choiceObj && choiceObj.stock !== null) {
          choiceObj.stock += quantity;
        }
      }
    }

    // Remove product from cart
    cart.products.splice(productIndex, 1);

    await product.save();
    await cart.save();

    // Populate with product details to include productPoints
    const populatedCart = await populateCartWithProductPoints(cart);
    populatedCart.products = populatedCart.products.map(product => ({
      ...product.toObject(),
      selectedOptions: product.selectedOptions || {}
    }));
    res.status(200).json(populatedCart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// update product quantity in cart
export const updateCartQuantity = async (req, res) => {
  console.log("=== BACKEND updateCartQuantity ===");
  console.log("req.params:", req.params);
  console.log("req.body:", req.body);
  
  try {
    const userId = getCartUserId(req, res);
    const { productId } = req.params;
    const { newQuantity } = req.body;
    
    console.log("userId:", userId);
    console.log("productId from params:", productId);
    console.log("newQuantity from body:", newQuantity);
    console.log("Type of newQuantity:", typeof newQuantity);
    
    if (newQuantity < 1) {
      console.log("❌ Validation failed: Quantity must be at least 1");
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    let cart = await getCartForUserService(userId);
    console.log("Cart found:", cart ? "Yes" : "No");
    
    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
        totalPrice: 0,
      });
      await cart.save();
    }
    
    console.log("Cart products count:", cart.products.length);
    
    // Check BOTH cart item _id AND productId
    const productIndex = cart.products.findIndex(
      (p) => {
        console.log(`Checking product: _id=${p._id}, productId=${p.productId._id || p.productId}`);
        
        // Check if it's a cart item _id
        if (p._id.toString() === productId) {
          console.log("✅ Found by cart item _id");
          return true;
        }
        
        // Check if it's a product ID
        const pId = p.productId._id ? p.productId._id.toString() : p.productId.toString();
        if (pId === productId) {
          console.log("✅ Found by product ID");
          return true;
        }
        
        return false;
      }
    );

    console.log("Product index found:", productIndex);

    if (productIndex === -1) {
      console.log("❌ Product not found in cart");
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const cartItem = cart.products[productIndex];
    console.log("Cart item found:", cartItem);
    
    // Get the actual product ID
    const actualProductId = cartItem.productId._id 
      ? cartItem.productId._id.toString() 
      : cartItem.productId.toString();
    
    console.log("Actual product ID:", actualProductId);
    
    const product = await getProductByIdService(actualProductId);

    if (!product) {
      console.log("❌ Product not found in DB");
      return res.status(404).json({ message: "Product not found in DB" });
    }

    console.log("Product found in DB:", product.name);

    const oldQuantity = cartItem.quantity;
    const difference = newQuantity - oldQuantity;
    
    console.log("Old quantity:", oldQuantity);
    console.log("Difference:", difference);

    const hasOptions = product.options && product.options.length > 0;
    console.log("Has options:", hasOptions);

    // Rest of your logic...
    
    if (difference > 0) {
      console.log("Increasing quantity by:", difference);
      // ... stock checking logic
    }

    if (difference < 0) {
      console.log("Decreasing quantity by:", Math.abs(difference));
      // ... stock return logic
    }

    cartItem.quantity = newQuantity;
    console.log("Updated cart item quantity to:", newQuantity);

    cart.totalPrice = cart.products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    await product.save();
    await cart.save();
    
    console.log("✅ Cart saved successfully");

    const populatedCart = await populateCartWithProductPoints(cart);
    populatedCart.products = populatedCart.products.map(product => ({
      ...product.toObject(),
      selectedOptions: product.selectedOptions || {}
    }));
    
    res.status(200).json(populatedCart);
  } catch (err) {
    console.error("❌ ERROR in updateCartQuantity:", err);
    res.status(500).json({ error: err.message });
  }
};

//clearCart
export const clearCart = async (req, res) => {
  try {
    const userId = getCartUserId(req, res);
    let cart = await getCartForUserService(userId);

    // if (!cart) {
    //     return res.status(404).json({ message: "Cart not found" });
    // }
    // لو الكارت مش موجود → ننشئ واحدة فارغة
    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
        totalPrice: 0,
      });
      await cart.save();
    }

    // لو الكارت فاضي أصلاً
    if (cart.products.length === 0) {
      return res.status(200).json({ message: "Cart is already empty", cart });
    }

    // رجّع كل كميات ال products للـ stock
    for (let item of cart.products) {
      const product = await getProductByIdService(item.productId);

      if (!product) continue; // لو المنتج اتحذف من DB متعمليش Error

      const quantity = item.quantity;

      // ✅ FIX: Check if product has options
      const hasOptions = product.options && product.options.length > 0;

      // -----------------------
      // Product WITH NO options
      // -----------------------
      if (!hasOptions) {
        product.stock += quantity;
      }

      // -----------------------
      // Product WITH options
      // -----------------------
      if (hasOptions && item.selectedOptions) {
        for (let opt of product.options) {
          const selected = item.selectedOptions[opt.name];
          if (!selected) continue;

          const choice = opt.choices.find((c) => c.label === selected);
          if (choice && choice.stock !== null) {
            choice.stock += quantity;
          }
        }
      }

      await product.save();
    }

    // بعد ما رجّعنا الستوك → نمسح كل المنتجات من cart
    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();

    // Populate with product details to include productPoints
    const populatedCart = await populateCartWithProductPoints(cart);
    populatedCart.products = populatedCart.products.map(product => ({
      ...product.toObject(),
      selectedOptions: product.selectedOptions || {}
    }));
    res.status(200).json({
      message: "Cart cleared successfully",
      cart: populatedCart,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
