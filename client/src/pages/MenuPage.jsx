import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  ToggleButton,
  ToggleButtonGroup,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "../redux/slices/CategorySlice";
import { fetchProductList } from "../redux/slices/ProductSlice";
import CardComponent from "../components/Card/CardComponent";
import { addToCart } from "../redux/slices/cartSlice";

function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  // const [view, setView] = useState("list"); // list | grid

  const [openPopup, setOpenPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const categories = useSelector((state) => state.category.list);
  const categoriesTabs = categories.map((cat) => cat.name.toUpperCase());

  //   const products = useSelector((state) => state.product.list)
  const products = useSelector((state) => state.product.filtered);
  const [selectedSizes, setSelectedSizes] = useState({});

  const isProductOutOfStock = (product) => {
    if (!product.options || product.options.length === 0) return false;

    return product.options.every((option) =>
      option.choices.every((choice) => choice.stock === 0)
    );
  };

  console.log("Products from Redux:", products);
  console.log(products[0]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name.toUpperCase());
    }
  }, [categories]);

  useEffect(() => {
    if (categories.length > 0) {
      const category = categories.find(
        (c) => c.name.toUpperCase() === activeCategory
      );
      if (category) {
        console.log("Category ID:", category._id);
        dispatch(
          fetchProductList({
            categoryId: category._id,
            searchTerm: search,
            page: 1,
            pageSize: 1000,
          })
        );
      } else {
        console.log("Category not found for:", activeCategory);
      }
    }
  }, [activeCategory, search, categories]);

  useEffect(() => {
    filterProducts();
  }, [products, activeCategory, search]);

  const filterProducts = () => {
    const f = products.filter((p) => {
      // console.log("p",p)
      // console.log("categ",categories.find(c => c._id === p.categoryId)?.name.toUpperCase());

      return (
        categories.find((c) => c._id === p.categoryId)?.name.toUpperCase() ===
          activeCategory && p.name.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFiltered(f);
  };

  const handelClick = (product, qty) => {
    let optionsPayload = {};

    // لو في خيارات موجودة للمنتج
    if (product.options && product.options.length > 0) {
      product.options.forEach((option) => {
        const key = `${product._id}_${option.name}`;
        const selectedValue =
          selectedSizes[key] || // إذا المستخدم اختار
          option.choices[0]?.label; // default choice

        if (selectedValue) {
          optionsPayload[option.name] = selectedValue;
        }
      });
    }

    dispatch(
      addToCart({
        productId: product._id,
        quantity: qty,
        selectedOptions: optionsPayload,
      })
    );

    console.log("SENT TO CART:", {
      productId: product._id,
      quantity: qty,
      selectedOptions: optionsPayload,
    });
  };

  //for Popup dialog
  const handleOpenPopup = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
    setSelectedProduct(null);
  };

  const handleSizeChange = (key, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [key]: size,
    }));
  };

  return (
    <>
      <Typography variant="h4" fontWeight={700} ml={4} mt={2} mb={3}>
        Menu
      </Typography>

      {/* Search + View Switch */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
      >
        <TextField
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", md: "60%" }, mb: { xs: 2, md: 0 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={
          categoriesTabs.indexOf(activeCategory) === -1
            ? 0
            : categoriesTabs.indexOf(activeCategory)
        }
        onChange={(e, idx) => setActiveCategory(categoriesTabs[idx])}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{
          borderBottom: "1px solid #ddd",
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            border: "1px solid #ccc",
            borderRadius: "8px",
            mr: 1,
            minHeight: "40px",
            fontWeight: 600,
          },
          "& .Mui-selected": {
            background: "#333",
            color: "#fff !important",
          },
        }}
      >
        {categoriesTabs.map((cat) => (
          <Tab key={cat} label={cat} />
        ))}
      </Tabs>

      {/* Category Title */}
      <Typography
        variant="h6"
        fontWeight={700}
        textTransform="uppercase"
        mb={2}
        mt={1}
      >
        {activeCategory}
      </Typography>

      {/* Products in Grid */}
      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6"> */}
      <div
        className={
          "grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6"
        }
      >
        {filtered.map((p) => (
          <CardComponent
            onClick={() => {
              handleOpenPopup(p);
            }}
            product={p}
            key={p._id}
            disabled={false}
            isReward={false}
          />
        ))}
      </div>

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
        {selectedProduct && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {selectedProduct.name}
            </DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={selectedProduct.imgURL}
                alt={selectedProduct.name}
                sx={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "cover",
                  borderRadius: 2,
                  mb: 2,
                }}
              />
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent="space-between"
                mb={2}
              >
                {/* الوصف والسعر */}
                <Box flex={1}>
                  <Typography color="text.secondary" mb={1}>
                    {selectedProduct.desc}
                  </Typography>
                  <Typography fontWeight={700} sx={{ color: "#e27e36" }}>
                    EGP {selectedProduct.basePrice}
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  ml={2}
                >
                  <Button
                    variant="contained"
                    sx={{
                      minWidth: 40,
                      bgcolor: "#e27e36",
                      borderRadius: 3,
                      "&:hover": { bgcolor: "#d26c2c" },
                    }}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                  <Typography fontWeight={700} my={1}>
                    {quantity}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      minWidth: 40,
                      bgcolor: "#e27e36",
                      borderRadius: 3,
                      "&:hover": { bgcolor: "#d26c2c" },
                    }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                </Box>
              </Box>
              {/* Size options */}

              {selectedProduct.options &&
                selectedProduct.options.length > 0 &&
                selectedProduct.options.map((option) => {
                  const allChoicesOutOfStock = option.choices.every(
                    (c) => c.stock === 0
                  );
                  const key = `${selectedProduct._id}_${option.name}`;
                  return (
                    <Box key={option.name} sx={{ mb: 2 }}>
                      <Typography sx={{ mb: 1, fontWeight: 600 }}>
                        {option.name}
                      </Typography>

                      <ToggleButtonGroup
                        disabled={allChoicesOutOfStock}
                        value={selectedSizes[key] || option.choices[0]?.label}
                        exclusive
                        onChange={(e, val) => val && handleSizeChange(key, val)}
                        size="small"
                        sx={{
                          mb: 1,
                          "& .MuiToggleButton-root": {
                            borderRadius: "20px",
                            border: `1px solid #e27e36`,
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#e27e36",
                            px: 3,
                            py: 0.5,
                            mx: 0.3,
                            minWidth: 40,
                          },
                          "& .Mui-selected": {
                            bgcolor: "#e27e36 !important",
                            color: "#fff !important",
                          },
                        }}
                      >
                        {option.choices.map((choice) => (
                          <ToggleButton
                            key={choice._id}
                            value={choice.label}
                            disabled={choice.stock === 0}
                            sx={{
                              opacity: choice.stock === 0 ? 0.4 : 1, // يفتح شوية لو خلصان
                              textDecoration:
                                choice.stock === 0 ? "line-through" : "none",
                            }}
                          >
                            {choice.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>
                  );
                })}
              {/* Total Price */}
              <Typography fontWeight={700} mb={2}>
                Total: EGP {selectedProduct.basePrice * quantity}
              </Typography>
              {/* Add to Cart */}
              <Button
                fullWidth
                variant="contained"
                disabled={isProductOutOfStock(selectedProduct)}
                sx={{
                  bgcolor: isProductOutOfStock(selectedProduct)
                    ? "grey.400"
                    : "#e27e36",
                  "&:hover": {
                    bgcolor: isProductOutOfStock(selectedProduct)
                      ? "grey.400"
                      : "#d26c2c",
                  },
                }}
                onClick={() => {
                  handelClick(selectedProduct, quantity);
                  handleClosePopup();
                }}
              >
                Add to Cart
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}

export default MenuPage;
