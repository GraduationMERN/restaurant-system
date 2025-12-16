// MenuBrowser.jsx - Browse and select menu items
import React, { useState, useEffect } from "react";
import { Plus, Minus, Search, Loader2 } from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../hooks/useToast";

export default function MenuBrowser({ selectedItems, onItemSelect, onItemRemove, onQuantityChange }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get("api/products");
        const data = response.data.data || response.data;
        setProducts(Array.isArray(data) ? data : []);

        // Extract categories
        const uniqueCategories = ["all", ...new Set(Array.isArray(data) ? data.map((p) => p.category).filter(Boolean) : [])];
        setCategories(uniqueCategories);
      } catch (error) {
        toast?.showToast?.({ message: "Failed to load menu items", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // `toast` from useToast may be unstable (new reference each render).
    // We intentionally omit it from deps to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === cat
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat === "all" ? "All Items" : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const selectedItem = selectedItems.find((item) => item.productId === product._id || item.productId?._id === product._id);

            return (
              <div key={product._id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover bg-slate-100"
                  />
                )}

                {/* Product Info */}
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 mb-1">{product.name}</h4>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-amber-600">
                      ${(product.basePrice || product.price)?.toFixed(2) || "0.00"}
                    </span>
                    {product.category && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Add/Remove Button */}
                  {!selectedItem ? (
                    <button
                      onClick={() =>
                        onItemSelect({
                          productId: product._id,
                          name: product.name,
                          price: product.basePrice || product.price,
                          quantity: 1,
                          totalPrice: product.basePrice || product.price,
                        })
                      }
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => onQuantityChange(product._id, selectedItem.quantity - 1)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                      <span className="font-bold text-slate-900 min-w-[40px] text-center">
                        {selectedItem.quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(product._id, selectedItem.quantity + 1)}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => onItemRemove(product._id)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-slate-500">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
