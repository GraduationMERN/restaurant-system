import React, { useEffect, useMemo, useRef, useState } from "react";
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
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "../redux/slices/CategorySlice";
import { fetchProducts } from "../redux/slices/ProductSlice";
import { getAllRewards } from "../redux/slices/rewardSlice";
import CardComponent from "../components/Card/CardComponent";
import { addToCart } from "../redux/slices/cartSlice";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../api/axios";
import RecommendedForProduct from "../components/recommendations/RecommendedForProduct";
import ProgressBar from "../components/Reward/ProgressBar";
import SmartSearchBar from "../components/common/SmartSearchBar";

function MenuPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
    const { user} = useSelector((state) => state.auth);
  const isMobile = useMediaQuery("(max-width:768px)");

  const categories = useSelector((state) => state.category.list);
  const products = useSelector((state) => state.product.list);
  const cartItem = useSelector((state) => state.cart.products);

  const totalItems = cartItem.reduce((a, b) => a + b.quantity, 0);

  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const categoryRefs = useRef({});
  const tabRefs = useRef({});


  //   const products = useSelector((state) => state.product.list)

  const [selectedSizes, setSelectedSizes] = useState({});
  const handelClick = (product, qty) => {
    let optionsPayload = {};

    if (product.options && product.options.length > 0) {
      product.options.forEach((option) => {
        const key = `${product._id}_${option.name}`;
        const selectedValue =
          selectedSizes[key] || option.choices[0]?.label;

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
  };


  const isProductOutOfStock = (product) => {
    if (!product.options || product.options.length === 0) return false;

    return product.options.every((option) =>
      option.choices.every((choice) => choice.stock === 0)
    );
  };


  /* ---------------- FETCH ONCE ---------------- */
  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(fetchProducts());
    dispatch(getAllRewards());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]._id);
    }
  }, [categories]);

  /* ---------------- GROUP PRODUCTS ---------------- */
  const groupedProducts = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c._id] = []));

    products.forEach((p) => {
      if (map[p.categoryId]) map[p.categoryId].push(p);
    });

    Object.keys(map).forEach((catId) => {
      map[catId] = map[catId].filter((p) => {
        const name = lang === "ar" ? p.name_ar || p.name : p.name;
        return name.toLowerCase().includes(search.toLowerCase());
      });
    });

    return map;
  }, [products, categories, search, lang]);

  /* ---------------- SCROLL → TAB SYNC ---------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.id);
          }
        });
      },
      {
        rootMargin: isMobile ? "-100px 0px -60% 0px" : "-140px 0px -65% 0px",
      }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, isMobile]);

  /* ---------------- AUTO-SCROLL ACTIVE TAB ---------------- */
  useEffect(() => {
    const tabEl = tabRefs.current[activeCategory];
    if (tabEl) {
      tabEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  /* ---------------- HELPERS ---------------- */
  const handleTabClick = (catId) => {
    categoryRefs.current[catId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
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

  const isOutOfStock = (product) =>
    product.options?.length &&
    product.options.every((o) => o.choices.every((c) => c.stock === 0));

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <div className="sticky top-0 z-20  pt-5 pl-5 bg-gray-50 rounded-2xl py-3 dark:bg-gray-800">
        <p className="text-xl md:text-2xl font-semibold">
          {t("Hello")}, <span className="text-primary font-bold">{user ? user.name.split(" ")[0] : t("Guest")}</span>
        </p>
        {/* CART */}
        <div className="absolute right-6 top-3">
          <button
            onClick={() => navigate("/checkout")}
            className="relative bg-white dark:bg-gray-900 text-primary px-3 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-col  items-center">
          {!user &&

          <div className="w-2/3 mb-15 mt-5">
            <span className="text-gray-500 underline flex justify-end cursor-pointer" onClick={()=>{navigate("/rewards")}}>see details</span>
            <ProgressBar />
          </div>
    }
          {/* SEARCH - Normal + AI Toggle */}
          <div className="w-full flex justify-center my-5 px-2">
            <div className="w-full max-w-2xl relative">
              {/* Normal Search (Default) */}
              <div
                className="
                  flex items-center 
                  w-full 
                  bg-surface 
                  border border-primary/50
                  rounded-xl 
                  shadow-sm
                  px-4 py-2 
                  focus-within:border-primary
                  transition-all duration-200
                "
              >
                <SearchIcon className="text-muted mr-2" sx={{ fontSize: 22 }} />
                
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full 
                    bg-transparent 
                    outline-none 
                    text-surface 
                    placeholder:text-muted
                    text-sm
                  "
                />

                {/* AI Search Toggle Button */}
                <button
                  onClick={() => {
                    // Open AI Search Modal/Dropdown
                    setSelectedProduct(null);
                    setOpenPopup(false);
                    const modal = document.getElementById('ai-search-modal');
                    if (modal) modal.classList.toggle('hidden');
                  }}
                  className="
                    ml-2 px-3 py-1.5 
                    bg-gradient-to-r from-purple-500 to-pink-500
                    hover:from-purple-600 hover:to-pink-600
                    text-white text-xs font-semibold
                    rounded-lg
                    flex items-center gap-1
                    transition-all duration-200
                    shadow-md hover:shadow-lg
                  "
                  title={lang === "ar" ? "بحث ذكي بالـ AI" : "AI Smart Search"}
                >
                  <span>✨</span>
                  <span className="hidden sm:inline">{lang === "ar" ? "AI" : "AI"}</span>
                </button>
              </div>

              {/* AI Search Modal/Dropdown */}
              <div 
                id="ai-search-modal"
                className="hidden absolute top-full left-0 right-0 mt-2 z-50"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-primary/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <span className="text-lg">🔮</span>
                      {lang === "ar" ? "البحث الذكي" : "AI Smart Search"}
                    </span>
                    <button 
                      onClick={() => document.getElementById('ai-search-modal')?.classList.add('hidden')}
                      className="text-muted hover:text-gray-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <SmartSearchBar
                    placeholder={lang === "ar" ? "اكتب أي حاجة حتى لو غلط..." : "Type anything, even misspelled..."}
                    onSearchResults={(results) => {
                      // Clear normal search when AI provides results or is cleared
                      if (results.length === 0) {
                        setSearch(""); // Clear normal search filter
                      }
                    }}
                    onProductClick={(product) => {
                      setSelectedProduct(product);
                      setQuantity(1);
                      setOpenPopup(true);
                      setSearch(""); // Clear normal search filter
                      document.getElementById('ai-search-modal')?.classList.add('hidden');
                    }}
                  />
                  <p className="text-xs text-muted mt-2 text-center">
                    {lang === "ar" ? "جرب: 'cofe' → Coffee ☕" : "Try: 'cofe' → Coffee ☕"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* TABS */}
        <Box
          sx={{
            backdropFilter: "blur(6px)",
            height: 55,
          }}
        >
          <Tabs
            value={activeCategory || false}
            variant="scrollable"
            allowScrollButtonsMobile={false}
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              px: 1,
              py: 1,
              minHeight: 70,

              "& .MuiTabs-flexContainer": {
                gap: "10px",
                alignItems: "center",
              },

              // kill default MUI color behavior
              "& .MuiTab-root": {
                color: "var(--color-on-surface)",
              },
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat._id;

              return (
                <Tab
                  key={cat._id}
                  value={cat._id}
                  ref={(el) => (tabRefs.current[cat._id] = el)}
                  onClick={() => handleTabClick(cat._id)}
                  label={lang === "ar" ? cat.name_ar : cat.name}
                  sx={{
                    position: "relative",
                    minHeight: 40,
                    px: 3,
                    borderRadius: "999px",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 700 : 600,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",

                    // COLORS
                    bgcolor: isActive ? "var(--color-primary)" : "var(--surface)",

                    color: isActive
                      ? "var(--color-on-primary-strong)"
                      : "var(--color-on-surface)",

                    // DEPTH
                    boxShadow: isActive
                      ? "0 6px 18px , transparent)"
                      : "0 1px 3px rgba(0,0,0,0.06)",

                    // MICRO-INTERACTION
                    transform: isActive ? "scale(1.05)" : "scale(1)",

                    // ACTIVE STATE OVERRIDE
                    "&.Mui-selected": {
                      color: "var(--color-on-primary-strong)",
                    },

                    "&:hover": {
                      transform: "scale(1.04)",
                      bgcolor: isActive
                        ? "var(--color-primary)"
                        : "var(--surface)",
                    },

                    // MOBILE FEEL
                    "@media (max-width: 768px)": {
                      minHeight: 44,
                      px: 2.5,
                      fontSize: "0.8rem",
                    },
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

      </div>

      {/* CATEGORY SECTIONS */}
      {categories.map((cat) => {
        const list = groupedProducts[cat._id] || [];
        if (!list.length) return null;

        return (
          <Box
            key={cat._id}
            ref={(el) => (categoryRefs.current[cat._id] = el)}
            data-id={cat._id}
            px={2}
            mt={4}
          >
            <Typography variant="h6" fontWeight={700} mb={2}>
              {lang === "ar" ? cat.name_ar : cat.name}
            </Typography>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 my-8">
              {list.map((p) => (
                <CardComponent
                  key={p._id}
                  product={p}
                  onClick={() => {
                    setSelectedProduct(p);
                    setQuantity(1);
                    setOpenPopup(true);
                  }}
                />
              ))}
            </div>
          </Box>
        );
      })}
      {/* Popup Dialog */}
      <Dialog
        open={openPopup}
        onClose={handleClosePopup}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 12,
            padding: 16,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#1f2937',
          },
        }}
      >
        {selectedProduct && (
          <>
            <DialogTitle 
              sx={{ 
                fontWeight: 700, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                color: 'inherit',
              }}
            >
              {lang === "ar"
                ? selectedProduct.name_ar || selectedProduct.name
                : selectedProduct.name}
              <IconButton 
                onClick={handleClosePopup}
                sx={{ 
                  color: 'inherit',
                  '&:hover': { 
                    bgcolor: 'var(--color-primary)', 
                    color: 'white' 
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ color: 'inherit' }}>
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
                  <Typography sx={{ color: 'inherit', opacity: 0.7 }} mb={1}>
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
                  <Typography fontWeight={700} my={1} sx={{ color: 'inherit' }}>
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
              <Typography fontWeight={700} mb={2} sx={{ color: 'inherit' }}>
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
              <RecommendedForProduct productId={selectedProduct._id} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}

export default MenuPage;
