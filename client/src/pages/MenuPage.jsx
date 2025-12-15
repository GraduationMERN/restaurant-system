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
import { useTranslation } from "react-i18next";
import {  ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";

function MenuPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [activeCategory, setActiveCategory] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  // const [view, setView] = useState("list"); // list | grid

  const [openPopup, setOpenPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const categories = useSelector((state) => state.category.list);
  // const categoriesTabs = categories.map((cat) => cat.name.toUpperCase());
  const categoriesTabs = categories.map((cat) =>
    lang === "ar" ? cat?.name_ar: cat?.name.toUpperCase()
  );

  //   const products = useSelector((state) => state.product.list)
  const products = useSelector((state) => state.product.filtered);
  const [selectedSizes, setSelectedSizes] = useState({});

  const navigate = useNavigate();
  const cartItem = useSelector((state) => state.cart.products);
  const totalItems = cartItem.reduce((acc, item) => acc + item.quantity, 0);
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
        (c) =>
          lang === "ar"
        ? c.name_ar === activeCategory
        :c.name.toUpperCase() === activeCategory
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
  }, [activeCategory, search, categories,lang]);

  useEffect(() => {
    filterProducts();
  }, [products, activeCategory, search]);

  const filterProducts = () => {
    const f = products.filter((p) => {
      // console.log("p",p)
      // console.log("categ",categories.find(c => c._id === p.categoryId)?.name.toUpperCase());

      const category = categories.find((c) => c._id === p.categoryId);
      if (!category) return false;

      const categoryName = lang === "ar" ? category.name_ar : category.name;
      const productName = lang === "ar" ? p.name_ar || p.name : p.name;
      return (
        categoryName.toUpperCase() === activeCategory.toUpperCase() &&
        productName.toLowerCase().includes(search.toLowerCase())
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
        {t("menu.title")}
      </Typography>

      {/* Top-right cart button */}
      <div className="fixed right-6 top-5 z-50">
        <button
          onClick={() => navigate('/checkout')}
          className="relative bg-primary/80  text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Search + View Switch */}
      <Box
        margin={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
      >
        {/* <TextField
          placeholder= {t("search.placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
    width: { xs: "100%", md: "50%" },
    mb: { xs: 2, md: 0 },
    "& .MuiInputBase-root": {
      backgroundColor: "var(--surface)",
      color: "var(--color-on-surface)",
      borderRadius: "12px",
      paddingRight: "8px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--color-secondary)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--color-primary)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--color-primary)",
      borderWidth: "2px",
    },
    "& .MuiInputBase-input::placeholder": {
      color: "var(--color-muted)",
      opacity: 1,
    },
    "& .MuiSvgIcon-root": {
      color: "var(--color-muted)",
    },
  }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          }}
        /> */}
        <div className="w-full flex justify-center mb-4 px-2">
          <div
            className="
              flex items-center 
              w-full md:w-1/2 
              bg-[var(--surface)] 
              border border-[var(--color-secondary)] 
              rounded-2xl 
              shadow-sm
              px-4 py-2 
              focus-within:border-[var(--color-primary)]
              transition-all duration-200
            "
          >
            <SearchIcon
              className="text-[var(--color-muted)] mr-2"
              sx={{ fontSize: 22 }}
            />

            <input
              type="text"
              placeholder={t("search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full 
                bg-transparent 
                outline-none 
                text-[var(--color-on-surface)] 
                placeholder:text-[var(--color-muted)]
                text-sm
              "
            />
          </div>
        </div>
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
            background: "var(--surface)",
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
        ml={1}
      >
        {activeCategory}
      </Typography>

      {/* Products in Grid */}
      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6"> */}
      <div
        className={
          "m-2 mb-10 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6"
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
              {/* {selectedProduct.name} */}
              {lang === "ar"
                ? selectedProduct.name_ar || selectedProduct.name
                : selectedProduct.name}
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
                    {/* {selectedProduct.desc} */}
                    {lang === "ar"
                      ? selectedProduct.desc_ar || selectedProduct.desc
                      : selectedProduct.desc}
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{ color: "var(--color-primary)" }}
                  >
                    {t("currency")} {selectedProduct.basePrice}
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
                      bgcolor: "var(--color-primary)",
                      borderRadius: 3,
                      "&:hover": { opacity: 0.9 },
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
                      bgcolor: "var(--color-primary)",
                      borderRadius: 3,
                      "&:hover": { opacity: 0.9 },
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
                        {/* {option.name} */}
                        {lang === "ar"
                          ? option.name_ar || option.name
                          : option.name}
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
                            border: `1px solid var(--color-primary)`,
                            textTransform: "none",
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            px: 3,
                            py: 0.5,
                            mx: 0.3,
                            minWidth: 40,
                          },
                          "& .Mui-selected": {
                            bgcolor: "var(--color-primary) !important",
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
                            {/* {choice.label} */}
                            {lang === "ar"
                              ? choice.label_ar || choice.label
                              : choice.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>
                  );
                })}
              {/* Total Price */}
              <Typography fontWeight={700} mb={2}>
                {t("popup.total")}: {t("currency")}{" "}
                {selectedProduct.basePrice * quantity}
              </Typography>
              {/* Add to Cart */}
              <Button
                fullWidth
                variant="contained"
                disabled={isProductOutOfStock(selectedProduct)}
                sx={{
                  bgcolor: isProductOutOfStock(selectedProduct)
                    ? "grey.400"
                    : "var(--color-primary)",
                  "&:hover": {
                    opacity: isProductOutOfStock(selectedProduct) ? 1 : 0.9,
                  },
                }}
                onClick={() => {
                  handelClick(selectedProduct, quantity);
                  handleClosePopup();
                }}
              >
                {t("popup.addToCart")}
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}

export default MenuPage;
