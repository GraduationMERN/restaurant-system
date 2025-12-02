import { Box, Typography, Stack, IconButton, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getCartForUser,
  updateCartQuantity,
  deleteProductFromCart
} from "../redux/slices/cartSlice";

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products: cartItems, totalPrice: subtotal, loading } = useSelector(
    (state) => state.cart
  );

  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

  if (loading) {
    return <Typography>Loading Cart...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 550, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        My Cart
      </Typography>

      {cartItems?.map((item) => (
        <Stack
          key={item.productId}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 2 }}
        >
          <Stack direction="row" gap={2}>
            <img
              src={item.image}
              width={85}
              height={85}
              style={{ borderRadius: 10 }}
            />

            <Box>
              <Typography fontWeight={600}>{item.name}</Typography>
              <Typography color="text.secondary">EGP {item.price}</Typography>

              <Stack direction="row" gap={1} alignItems="center" mt={1}>
                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(
                      updateCartQuantity({
                        productId: item.productId,
                        quantity: item.quantity + 1, // <-- synced with slice
                      })
                    )
                  }
                >
                  <AddIcon fontSize="small" />
                </IconButton>

                <Typography>{item.quantity}</Typography>

                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(
                      updateCartQuantity({
                        productId: item.productId,
                        quantity: item.quantity - 1, // <-- synced with slice
                      })
                    )
                  }
                  disabled={item.quantity <= 1} // optional: prevent going below 1
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1} mt={1}>
                <DeleteOutlineIcon fontSize="small" color="error" />
                <Typography
                  color="error"
                  sx={{ cursor: "pointer" }}
                  onClick={() => dispatch(deleteProductFromCart(item.productId))}
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
        <Typography fontWeight={700}>EGP {subtotal}</Typography>
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
