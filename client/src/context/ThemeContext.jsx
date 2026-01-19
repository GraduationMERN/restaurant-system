import { createContext, useState, useContext, useEffect, useMemo } from "react";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("theme") || "light";
      }
    } catch (e) {
      // ignore
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
