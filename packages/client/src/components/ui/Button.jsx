import React from "react";
import { motion } from "framer-motion";

export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const variants = {
    primary:
      "bg-kredivo-primary border-kredivo-primary text-white hover:bg-kredivo-primary-hover focus:ring-kredivo-primary",
    secondary:
      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-kredivo-primary hover:text-white hover:border-kredivo-primary focus:ring-kredivo-primary",
    danger:
      "bg-danger border-danger text-white hover:bg-danger-hover focus:ring-danger",
  };

  const combinedClasses = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </motion.button>
  );
};
