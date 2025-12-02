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
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import api from "../api/axios";
import { useDispatch, useSelector } from "react-redux";
import { getAllCategories } from "../redux/slices/CategorySlice";
import { fetchProductList } from "../redux/slices/ProductSlice";


function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // list | grid

  const categories  = useSelector((state) => state.category.list);
  const categoriesTabs = categories.map(cat => cat.name.toUpperCase());

//   const products = useSelector((state) => state.product.list);
const products = useSelector((state) => state.product.filtered);

// console.log("Products from Redux:", products);
// console.log(products[0]);

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
    const category = categories.find(c => c.name.toUpperCase() === activeCategory);
    if(category){  
      console.log("Category ID:", category._id);
      dispatch(fetchProductList({ 
        categoryId: category._id, 
        searchTerm: search, 
        page: 1, 
        pageSize: 1000 
      }));
    } else {
      console.log("Category not found for:", activeCategory);
    }
}
}, [activeCategory, search, categories]);


  useEffect(() => {
    filterProducts();
  }, [products, activeCategory, search]);

  const filterProducts = () => {
    const f = products.filter(
    (p) =>
    {
        // console.log("p",p)
        // console.log("categ",categories.find(c => c._id === p.categoryId)?.name.toUpperCase());
        
        return categories.find(c => c._id === p.categoryId)?.name.toUpperCase() === activeCategory &&
        p.name.toLowerCase().includes(search.toLowerCase())}
    );
    setFiltered(f);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 9, mb: 6 }}>
      {/* Page Title */}
      <Typography variant="h4" fontWeight={700} mb={3}>
        Menu
      </Typography>

      {/* Search + View Switch */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap">
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

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(e, v) => v && setView(v)}
        >
          <ToggleButton value="list">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="grid">
            <GridViewIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Tabs */}
      <Tabs
        value={categoriesTabs.indexOf(activeCategory) === -1 ? 0 : categoriesTabs.indexOf(activeCategory)}
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

      {/* LIST view */}
      {view === "list" && (
        <Box>
          {filtered.map((p) => (
            <Box
              key={p._id}
              display="flex"
              alignItems="center"
              borderBottom="1px solid #eee"
              py={2}
              flexWrap="wrap"
            >
              <CardMedia
                component="img"
                image={p.imgURL}
                alt={p.name}
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: 2,
                  mr: 2,
                  mb: { xs: 1, md: 0 },
                }}
              />

              <Box flex={1} minWidth={0}>
                <Typography fontSize={18} fontWeight={600}>
                  {p.name}
                </Typography>
                <Typography color="text.secondary" sx={{ width: { xs: "100%", md: "80%" } }}>
                  {p.desc}
                </Typography>
              </Box>

              <Typography fontWeight={600} mr={2}>
                EGP {p.basePrice}
              </Typography>

              {/* <IconButton
                sx={{
                  border: "1px solid #ff7b9c",
                  color: "#ff7b9c",
                  width: 40,
                  height: 40,
                  mt: { xs: 1, md: 0 },
                }}
              >
                +
              </IconButton> */}
            <IconButton
                sx={{
                // position: "absolute",
                bottom: 0,
                top: 0,
                width: 50,
                height: "100%",
                borderRadius: "16px ",
                bgcolor: "#e27e36",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                transition: "0.5s ease",
                "&:hover": {
                    transform: "rotate(360deg)",
                    bgcolor: "#e27e36",
                },
                }}
            >
                +
            </IconButton>
              
            </Box>
          ))}
        </Box>
      )}

      {/* GRID view */}
      {view === "grid" && (
  <Grid container spacing={3}>
    {filtered.map((p) => (
      <Grid item xs={12} sm={6} md={4} key={p._id}>

        <Card
          sx={{
            position: "relative",
            borderRadius: 4,
            boxShadow: "0px 4px 14px rgba(0,0,0,0.1)",
            p: 2,
            overflow: "hidden",
            transition: "0.3s ease",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            },
          }}
        >
          <CardMedia
            component="img"
            image={p.imgURL}
            sx={{
              height: 200,
              borderRadius: 3,
              mb: 2,
              objectFit: "cover",
            }}
          />

          <CardContent sx={{ pr: 7 }}>
            <Typography variant="h6" fontWeight={700}>
              {p.name}
            </Typography>
            <Typography color="text.secondary" mb={1}>
              {p.desc}
            </Typography>
            <Typography fontWeight={700}>EGP {p.basePrice}</Typography>
          </CardContent>

          {/* FULL HEIGHT BUTTON ON RIGHT */}
          <IconButton
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 55,
              height: "10%",
              borderRadius: "16px 16px 0 0",
              bgcolor: "#e27e36",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              transition: "0.5s ease",
              "&:hover": {
                transform: "rotate(360deg)",
                bgcolor: "#ff3f6e",
              },
            }}
          >
            +
          </IconButton>
        </Card>

      </Grid>
    ))}
  </Grid>
)}

    </Container>
  );
}

export default MenuPage;
