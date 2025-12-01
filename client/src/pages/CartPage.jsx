import { Box, Typography, Stack, IconButton, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  deleteProductFromCart,
  updateCartQuantity,
  getCartForUser,
} from "../redux/slices/cartSlice";
import { useEffect } from "react";

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products, totalPrice } = useSelector((state) => state.cart);

  // Fetch cart items on mount
  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

  const handleIncrease = (productId, qty) => {
    dispatch(updateCartQuantity({ productId, newQuantity: qty + 1 }));
  };

  const handleDecrease = (productId, qty) => {
    if (qty > 1) {
      dispatch(updateCartQuantity({ productId, newQuantity: qty - 1 }));
    }
  };

  const handleDelete = (productId) => {
    dispatch(deleteProductFromCart(productId));
  };

  if (!products || products.length === 0) {
    return (
      <Box sx={{ maxWidth: 550, mx: "auto", py: 4, textAlign: "center" }}>
        <Typography variant="h5">Your cart is empty</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 550, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>My Cart</Typography>

      {products.map((item) => (
        <Stack
          key={item.productId._id}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 2 }}
        >
          <Stack direction="row" gap={2}>
            <img
              src={item.productId.imgURL}
              width={85}
              height={85}
              style={{ borderRadius: 10 }}
            />

            <Box>
              <Typography fontWeight={600}>{item.productId.name}</Typography>
              <Typography color="text.secondary">EGP {item.productId.price}</Typography>

              <Stack direction="row" gap={1} alignItems="center" mt={1}>
                <IconButton size="small" onClick={() => handleIncrease(item.productId._id, item.quantity)}>
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography>{item.quantity}</Typography>
                <IconButton size="small" onClick={() => handleDecrease(item.productId._id, item.quantity)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1} mt={1}>
                <DeleteOutlineIcon
                  fontSize="small"
                  color="error"
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleDelete(item.productId._id)}
                />
                <Typography
                  color="error"
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleDelete(item.productId._id)}
                >
                  Delete
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      ))}

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={600}>Subtotal</Typography>
        <Typography fontWeight={700}>EGP {totalPrice}</Typography>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3, bgcolor: "#ff9ecf", color: "#000" }}
        onClick={() => navigate("/checkout")}
      >
        Go to Order
      </Button>
    </Box>
  );
}
