import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Divider,
  DialogTitle,
  DialogContent,
  Dialog,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getCartForUser,
  updateCartQuantity,
  deleteProductFromCart,
  clearAlerts,
} from "../redux/slices/cartSlice";

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    products: cartItems,
    totalPrice: subtotal,
    loading,
    error,
  } = useSelector((state) => state.cart);

  console.log(" Cart Items:", cartItems);

  useEffect(() => {
    dispatch(getCartForUser());
  }, [dispatch]);

  useEffect(() => {
    console.log("Cart Items changed:", cartItems);
  }, [cartItems]);

  //for Popup dialog
  const [message, setMessage] = useState(null);
  const [openPopup, setOpenPopup] = useState(false);

  const handleClosePopup = () => {
    setOpenPopup(false);
    setMessage(null);
  };

  useEffect(() => {
    if (error) {
      setMessage(error);
      setOpenPopup(true);
    }
  }, [error]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box sx={{ maxWidth: 550, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        My Cart
      </Typography>

      {cartItems?.map((item) => (
        <Stack
          key={item.productId._id}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 2 }}
        >
          <Stack direction="row" gap={2}>
            <img
              src={item.productId?.imgURL}
              width={85}
              height={85}
              style={{ borderRadius: 10 }}
            />

            <Box>
              <Typography fontWeight={600}>{item.productId?.name}</Typography>
              <Typography color="text.secondary">EGP {item.price}</Typography>
              <Typography color="text.secondary">
                {item.selectedOptions &&
                Object.keys(item.selectedOptions).length > 0
                  ? Object.entries(item.selectedOptions)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")
                  : "No options selected"}
                  {console.log("OPTIONS:", item.selectedOptions)}
              </Typography>

              <Stack direction="row" gap={1} alignItems="center" mt={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    dispatch(clearAlerts());
                    dispatch(
                      updateCartQuantity({
                        cartItemId: item.productId._id,
                        newQuantity: item.quantity + 1,
                      })
                    );
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>

                <Typography>{item.quantity}</Typography>

                <IconButton
                  size="small"
                  onClick={() => {
                    dispatch(clearAlerts());
                    dispatch(
                      updateCartQuantity({
                        cartItemId: item.productId._id,
                        newQuantity: item.quantity - 1,
                      })
                    );
                  }}
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
                  onClick={() => {
                    dispatch(clearAlerts());
                    dispatch(deleteProductFromCart(item.productId._id));
                  }}
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
        sx={{
          mt: 3,
          bgcolor: "var(--color-secondary)",
          color: "#fff",
          "&:hover": {
            opacity: 0.85, // يخلي اللون أغمق بشكل نسبي
          },
          transition: "opacity 0.3s ease",
        }}
        onClick={() => navigate("/checkout")}
      >
        Go to Order
      </Button>
      {/* Popup Dialog */}
      <Dialog
        open={openPopup}
        onClose={handleClosePopup}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        {message && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              looks like something's wrong!
            </DialogTitle>
            <DialogContent>
              <Typography color="error" sx={{ mb: 2 }}>
                {message}
              </Typography>
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  onClick={handleClosePopup}
                  sx={{
                    mt: 3,
                    bgcolor: "var(--color-secondary)",
                    color: "#fff",
                    "&:hover": {
                      opacity: 0.85, // يخلي اللون أغمق بشكل نسبي
                    },
                    transition: "opacity 0.3s ease",
                  }}
                >
                  Close
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
