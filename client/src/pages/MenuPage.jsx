import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "../redux/slices/CategorySlice";
import { fetchProducts } from "../redux/slices/ProductSlice";
import CardComponent from "../components/Card/CardComponent";
import { addToCart } from "../redux/slices/cartSlice";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";

function MenuPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

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

  const tabsWrapperRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({});

  /* ---------------- FETCH ONCE ---------------- */
  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(fetchProducts());
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

  const isOutOfStock = (product) =>
    product.options?.length &&
    product.options.every((o) => o.choices.every((c) => c.stock === 0));

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <Typography variant="h4" fontWeight={700} ml={2} mt={2}>
        {t("menu.title")}
      </Typography>

      {/* CART */}
      <div className="fixed right-4 top-4 z-50">
        <button
          onClick={() => navigate("/cart")}
          className="relative bg-primary text-white px-3 py-2 rounded-full shadow-lg"
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex justify-center my-3 px-2">
        <div className="flex items-center w-full bg-[var(--surface)] border rounded-2xl px-4 py-2">
          <SearchIcon sx={{ mr: 1 }} />
          <input
            className="w-full bg-transparent outline-none"
            placeholder={t("search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABS */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          // bgcolor: "var(--surface)",
          // borderBottom: "1px solid var(--border-color)",
          backdropFilter: "blur(6px)",
          height: 55,
        }}
      >
        <Tabs
          value={activeCategory}
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
                  bgcolor: isActive
                    ? "var(--color-primary)"
                    : "var(--surface)",

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {/* POPUP */}
      <Dialog open={openPopup} onClose={() => setOpenPopup(false)} fullWidth>
        {selectedProduct && (
          <>
            <DialogTitle>
              {lang === "ar"
                ? selectedProduct.name_ar || selectedProduct.name
                : selectedProduct.name}
            </DialogTitle>
            <DialogContent>
              <Button
                fullWidth
                variant="contained"
                disabled={isOutOfStock(selectedProduct)}
                onClick={() => {
                  dispatch(
                    addToCart({
                      productId: selectedProduct._id,
                      quantity,
                    })
                  );
                  setOpenPopup(false);
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
