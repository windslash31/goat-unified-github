import React, { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Check, X, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import { useDebounce } from "../../hooks/useDebounce";

// This is the function that React Query will use to fetch data
const fetchEmployeeOptions = async ({ pageParam = 1, queryKey }) => {
  const [, searchTerm] = queryKey;
  const { data } = await api.get(
    `/api/employees/options/search?q=${searchTerm}&page=${pageParam}`
  );
  return { ...data, nextPage: data.hasMore ? pageParam + 1 : undefined };
};

export const SearchableSelect = ({
  value,
  onChange,
  placeholder,
  initialDisplayValue = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialDisplayValue);
  const [selectedDisplay, setSelectedDisplay] = useState(initialDisplayValue);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const observerRef = useRef();

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["employeeSearch", debouncedSearchTerm],
      queryFn: fetchEmployeeOptions,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      enabled: isOpen,
      keepPreviousData: true, // This prevents the list from disappearing during refetch
    });

  const options = data?.pages.flatMap((page) => page.results) ?? [];

  const lastElementRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setInputValue(selectedDisplay);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedDisplay]);

  const handleSelect = (option) => {
    const display = `${option.first_name} ${option.last_name} (${option.employee_email})`;
    onChange(option.id.toString());
    setSelectedDisplay(display);
    setInputValue(display);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value === "") {
      onChange("");
      setSelectedDisplay("");
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (selectedDisplay && !inputValue) {
      setInputValue(selectedDisplay);
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const itemVariants = {
    hidden: { y: -10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputClick}
          placeholder={placeholder}
          className="w-full flex items-center justify-between px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-kredivo-primary transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {isFetching && !isFetchingNextPage && (
            <Loader size={16} className="animate-spin text-gray-400" />
          )}
          <ChevronsUpDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            ref={listRef}
          >
            {options.length > 0 ? (
              <motion.ul
                className="py-1"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <AnimatePresence>
                  {options.map((option, index) => (
                    <motion.li
                      key={option.id}
                      ref={index === options.length - 1 ? lastElementRef : null}
                      variants={itemVariants}
                      layout="position"
                    >
                      <button
                        onClick={() => handleSelect(option)}
                        className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span className="truncate">
                          {option.first_name} {option.last_name} (
                          {option.employee_email})
                        </span>
                        {String(option.id) === String(value) && (
                          <Check className="w-4 h-4 text-kredivo-primary" />
                        )}
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {isFetchingNextPage && (
                  <li className="flex items-center justify-center p-2 text-sm text-gray-500">
                    <Loader size={16} className="animate-spin mr-2" /> Loading
                    more...
                  </li>
                )}
              </motion.ul>
            ) : (
              <div className="p-4 text-sm text-center text-gray-500">
                {isFetching
                  ? "Loading..."
                  : debouncedSearchTerm
                  ? "No employees match your search."
                  : "No active employees found."}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
