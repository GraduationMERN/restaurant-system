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
  const [darkMode, setDarkMode] = useState(false);

  const {
    products: cartItems,
    totalPrice: subtotal,
    loading,
    error,
  } = useSelector((state) => state.cart);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
        className={darkMode ? "dark" : ""}
        sx={{ minHeight: "100vh", bgcolor: "var(--bg-default)" }}
      >
        <Box
          color="var(--color-on-surface)"
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
      </Box>
    );
  }
  return (
    <Box
      sx={{
        color: "var(--color-on-surface)",
        minHeight: "100vh",
        bgcolor: "var(--bg-default)",
        py: 4,
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        ml={4}
        mb={4}
        sx={{ color: "var(--color-on-surface)" }}
      >
        My Cart
      </Typography>

      {/* Main layout: products + summary */}
      <Stack
        sx={{ color: "var(--color-on-surface)", px: { xs: 2, md: 4 } }}
        direction={{ xs: "column", md: "row" }}
        spacing={6}
        justifyContent="center"
        alignItems={{ xs: "stretch", md: "flex-start" }}
      >
        {/* Products List */}
        <Box sx={{ flex: 1, maxWidth: 600 }}>
          {cartItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 12 }}>
              <Typography variant="h6" fontWeight={600}>
                Your cart is empty 🛒
              </Typography>
              {/* <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/menu")}
                  >
                    Start Shopping
                  </Button> */}
            </Box>
          ) : (
            cartItems?.map((item) => (
              <Stack
                key={item.productId?._id}
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 5,
                  boxShadow: 3,
                  bgcolor: "var(--surface)",
                  color: "var(--color-on-surface)",
                }}
              >
                <Stack
                  sx={{ color: "var(--color-on-surface)" }}
                  direction="row"
                  gap={2}
                >
                  <img
                    src={item.productId?.imgURL}
                    width={95}
                    height={85}
                    style={{ borderRadius: 10, objectFit: "cover" }}
                  />

                  <Box sx={{ color: "var(--color-on-surface)" }}>
                    <Typography
                      fontWeight={600}
                      sx={{ color: "var(--color-on-surface)" }}
                    >
                      {item.productId?.name}
                    </Typography>
                    <Typography color="text.secondary">
                      EGP {item.price}
                    </Typography>
                    <Typography color="text.secondary" fontSize={15}>
                      {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0
                        ? Object.entries(item.selectedOptions)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")
                        : "No options selected"}
                    </Typography>

                    <Stack
                      sx={{ color: "var(--color-on-surface)" }}
                      direction="row"
                      alignItems="center"
                      gap={1}
                      mt={1}
                    >
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
                <Stack
                  sx={{ color: "var(--color-on-surface)" }}
                  direction="row"
                  alignItems="center"
                  gap={1}
                  mt={1}
                >
                  <Button
                    variant="contained"
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
                    disabled={item.quantity <= 1}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      padding: 0,
                      bgcolor: "var(--color-primary)",
                      color: "#fff",
                      fontWeight: 700,
                      "&:hover": { opacity: 0.9 },
                      borderRadius: "50%",
                    }}
                  >
                    -
                  </Button>

                  <Typography
                    sx={{
                      color: "var(--color-on-surface)",
                      minWidth: 24,
                      textAlign: "center",
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity}
                  </Typography>

                  <Button
                    variant="contained"
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
                    sx={{
                      minWidth: 32,
                      height: 32,
                      padding: 0,
                      bgcolor: "var(--color-primary)",
                      color: "#fff",
                      fontWeight: 700,
                      "&:hover": { opacity: 0.9 },
                      borderRadius: "50%",
                    }}
                  >
                    +
                  </Button>
                </Stack>
              </Stack>
            ))
          )}
        </Box>

        {/* Summary Box */}
        <Box
          sx={{
            width: { xs: "100%", md: 400 },
            color: "var(--color-on-surface)",
            bgcolor: "var(--surface)",
            p: 3,
            borderRadius: 3,
            boxShadow: 3,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ color: "var(--color-on-surface)" }}
            variant="h6"
            fontWeight={700}
            mb={2}
            // color="var(--color-secondary)"
          >
            Cart Totals
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack
            sx={{ color: "var(--color-on-surface)" }}
            direction="row"
            justifyContent="space-between"
            mb={1}
          >
            <Typography sx={{ color: "var(--color-on-surface)" }}>
              Total Items
            </Typography>
            <Typography sx={{ color: "var(--color-primary)" }}>
              {totalItems}
            </Typography>
          </Stack>

          <Stack
            sx={{ color: "var(--color-on-surface)" }}
            direction="row"
            justifyContent="space-between"
            mb={3}
          >
            <Typography sx={{ color: "var(--color-on-surface)" }}>
              Total Price
            </Typography>
            <Typography fontWeight={700} sx={{ color: "var(--color-primary)" }}>
              EGP {subtotal}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: "var(--color-secondary)",
              color: "var(--surface)",
              "&:hover": {
                opacity: 0.85,
              },
              transition: "opacity 0.3s ease",
            }}
            onClick={() => navigate("/checkout")}
          >
            Go to Order
          </Button>
        </Box>
      </Stack>

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
              Out of Stock
            </DialogTitle>
            <DialogContent>
              <Typography color="error" sx={{ mb: 2 }}>
                {message}
              </Typography>
              <Box
                textAlign="center"
                mt={2}
                sx={{ color: "var(--color-on-surface)" }}
              >
                <Button
                  variant="contained"
                  onClick={handleClosePopup}
                  sx={{
                    mt: 3,
                    bgcolor: "var(--color-secondary)",
                    color: "var(--surface)",
                    "&:hover": { opacity: 0.85 },
                    transition: "opacity 0.3s ease",
                    width: "100%",
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
