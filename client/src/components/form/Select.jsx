import { useState } from "react";
import { ChevronDownIcon } from "../../icons/admin-icons";

const Select = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  variant = "default",
  color = "brand",
  size = "md",
  fullWidth = true,
}) => {
  // Manage the selected value
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    if (onChange) onChange(value);
  };
  if (variant === "pill") {
    const colorStyles = {
      brand: {
        bg: "bg-brand-50 dark:bg-brand-500/15",
        text: "text-brand-700 dark:text-brand-400",
        icon: "text-brand-500",
      },
      warning: {
        bg: "bg-warning-50 dark:bg-warning-500/15",
        text: "text-warning-700 dark:text-orange-400",
        icon: "text-warning-600",
      },
      success: {
        bg: "bg-success-50 dark:bg-success-500/15",
        text: "text-success-700 dark:text-success-500",
        icon: "text-success-600",
      },
      info: {
        bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
        text: "text-blue-light-700 dark:text-blue-light-500",
        icon: "text-blue-light-500",
      },
    };
    const styles = colorStyles[color] || colorStyles.brand;
    const height = size === "sm" ? "h-9" : "h-11";
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          className={`${height} w-full appearance-none rounded-full px-3 pr-8 text-theme-xs font-medium border border-transparent ${styles.bg} ${styles.text} shadow-none focus:outline-hidden`}
          value={selectedValue}
          onChange={handleChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDownIcon className={`size-4 ${styles.icon}`} />
        </span>
      </div>
    );
  }

  return (
    <select
      className={`h-11 ${fullWidth ? "w-full" : ""} appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${selectedValue ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"} ${className}`}
      value={selectedValue}
      onChange={handleChange}
    >
      <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
