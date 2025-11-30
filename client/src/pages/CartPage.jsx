import { Box, Typography, Stack, IconButton, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const navigate = useNavigate();

  const cartItems = [
    { id: 1, title: "SKILLET SNICKERS", price: 229, qty: 1, img: "/img1.jpg" },
    { id: 2, title: "CONE LOTUS", price: 274, qty: 2, img: "/img2.jpg" },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Box sx={{ maxWidth: 550, mx: "auto", py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={3}>My Cart</Typography>

      {cartItems.map(item => (
        <Stack
          key={item.id}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, p:2, borderRadius:2, boxShadow:2 }}
        >
          <Stack direction="row" gap={2}>
            <img src={item.img} width={85} height={85} style={{ borderRadius:10 }} />

            <Box>
              <Typography fontWeight={600}>{item.title}</Typography>
              <Typography color="text.secondary">EGP {item.price}</Typography>

              <Stack direction="row" gap={1} alignItems="center" mt={1}>
                <IconButton size="small"><AddIcon fontSize="small"/></IconButton>
                <Typography>{item.qty}</Typography>
                <IconButton size="small"><RemoveIcon fontSize="small"/></IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1} mt={1}>
                <DeleteOutlineIcon fontSize="small" color="error"/>
                <Typography color="error" sx={{cursor:"pointer"}}>Delete</Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      ))}

      <Divider sx={{my:3}} />

      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={600}>Subtotal</Typography>
        <Typography fontWeight={700}>EGP {subtotal}</Typography>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt:3, bgcolor:"#ff9ecf", color:"#000" }}
        onClick={() => navigate("/checkout")} // لو عندك صفحة Checkout لاحقًا
      >
        Go to Order
      </Button>
    </Box>
  );
}
