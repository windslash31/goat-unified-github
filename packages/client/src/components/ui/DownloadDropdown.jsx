import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, Loader } from "lucide-react";
import { Button } from "./Button";

export const DownloadDropdown = ({ onSelect, isDownloading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { id: "pdf", name: "Download as PDF" },
    { id: "excel", name: "Download as Excel (XLSX)" },
    { id: "csv", name: "Download as CSV" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (format) => {
    onSelect(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        className="w-full sm:w-auto justify-center"
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {isDownloading ? "Generating..." : "Download"}
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20"
          >
            <ul className="py-1">
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    onClick={() => handleSelect(option.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {option.name}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
