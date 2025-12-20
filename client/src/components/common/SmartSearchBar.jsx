import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  semanticSearch,
  clearSearch,
  clearSuggestions,
  setQuery,
} from "../../redux/slices/searchSlice";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress } from "@mui/material";

/**
 * SmartSearchBar Component
 * ========================
 * AI-powered search bar with:
 * - Debounced semantic search
 * - "Did you mean?" suggestions
 * - Quick autocomplete dropdown
 * - Bilingual support (EN/AR)
 */

const SmartSearchBar = ({
  onSearchResults,
  onProductClick,
  placeholder,
  debounceMs = 500,
  minChars = 2,
}) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Redux state
  const {
    results,
    suggestions,
    isSearching,
    lastSearchedQuery,
  } = useSelector((state) => state.search);

  // Local state
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced search
  const performSearch = useCallback(
    (query) => {
      if (query.length >= minChars) {
        dispatch(semanticSearch({ query, limit: 10, lang }));
      }
    },
    [dispatch, lang, minChars]
  );

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    dispatch(setQuery(value));

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < minChars) {
      dispatch(clearSearch());
      setShowDropdown(false);
      return;
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
      setShowDropdown(true);
    }, debounceMs);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.text);
    dispatch(setQuery(suggestion.text));
    performSearch(suggestion.text);
    dispatch(clearSuggestions());
  };

  // Handle result click
  const handleResultClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    }
    // Clear everything after selection
    setInputValue("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    dispatch(clearSearch());
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    dispatch(clearSearch());
    // Notify parent that search was cleared
    if (onSearchResults) {
      onSearchResults([]);
    }
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = results.length + suggestions.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else {
            handleResultClick(results[selectedIndex - suggestions.length]);
          }
        } else if (inputValue.length >= minChars) {
          performSearch(inputValue);
          setShowDropdown(true);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pass results to parent when they change
  useEffect(() => {
    if (onSearchResults && results.length > 0) {
      onSearchResults(results);
    }
  }, [results, onSearchResults]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="smart-search-container relative w-full">
      {/* Search Input */}
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
          ref={inputRef}
          type="text"
          placeholder={placeholder || t("search.placeholder")}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          className="
            w-full 
            bg-transparent 
            outline-none 
            text-surface 
            placeholder:text-muted
            text-sm
          "
          aria-label="Search products"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
        />

        {/* Loading indicator */}
        {isSearching && (
          <CircularProgress size={18} className="text-primary mr-2" />
        )}

        {/* Clear button */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <CloseIcon sx={{ fontSize: 18 }} className="text-muted" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (suggestions.length > 0 || results.length > 0) && (
        <div
          ref={dropdownRef}
          className="
            absolute top-full left-0 right-0 mt-2
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-xl shadow-lg
            max-h-80 overflow-y-auto
            z-50
          "
          role="listbox"
        >
          {/* Suggestions ("Did you mean?") */}
          {suggestions.length > 0 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-muted px-2 mb-1">
                {lang === "ar" ? "هل تقصد:" : "Did you mean:"}
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.productId || index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg
                    text-sm font-medium text-primary
                    hover:bg-primary/10
                    transition-colors
                    ${selectedIndex === index ? "bg-primary/10" : ""}
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  "{suggestion.text}"
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              {results.slice(0, 5).map((product, index) => {
                const actualIndex = suggestions.length + index;
                return (
                  <button
                    key={product._id}
                    onClick={() => handleResultClick(product)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors
                      ${selectedIndex === actualIndex ? "bg-gray-100 dark:bg-gray-700" : ""}
                    `}
                    role="option"
                    aria-selected={selectedIndex === actualIndex}
                  >
                    {/* Product Image */}
                    <img
                      src={product.imgURL}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />

                    {/* Product Info */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted">
                        {product.categoryName} • {product.basePrice} {t("currency")}
                      </p>
                    </div>

                    {/* Score badge (optional) */}
                    {product.score && (
                      <span className="text-xs text-muted bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {Math.round(product.score * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Show more results hint */}
              {results.length > 5 && (
                <p className="text-center text-xs text-muted py-2">
                  +{results.length - 5} {lang === "ar" ? "نتائج أخرى" : "more results"}
                </p>
              )}
            </div>
          )}

          {/* No results */}
          {!isSearching && results.length === 0 && inputValue.length >= minChars && (
            <div className="p-4 text-center text-muted">
              {lang === "ar" ? "لا توجد نتائج" : "No results found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
