import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./Portal";

export const CustomSelect = ({
  id,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const optionsRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );

  const onSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        optionsRef.current &&
        !optionsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-kredivo-primary transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        disabled={disabled}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronsUpDown className="w-5 h-5 text-gray-400" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <Portal>
            <motion.div
              ref={optionsRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
              }}
              // --- MODIFICATION HERE ---
              // Added a data-role attribute to identify this dropdown
              data-role="custom-select-options"
              className="z-[9999] max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <ul className="py-1">
                {options.map((option) => (
                  <li key={option.id}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelect(option.id)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="truncate">{option.name}</span>
                      {String(option.id) === String(value) && (
                        <Check className="w-4 h-4 text-kredivo-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};
