import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ options, value, onChange, placeholder = "Select...", id = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.id === value);

  // Effect to handle closing the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={selectRef}>
      {/* The main button that shows the selected value */}
      <button
        id={id} // <-- ADD THE ID HERE
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 flex items-center justify-between text-left focus:ring-kredivo-primary focus:border-kredivo-primary focus:outline-none"
      >
        <span className="truncate">{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* The dropdown options list */}
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto focus:outline-none">
          {options.map(option => (
            <li
              key={option.id}
              onClick={() => handleSelectOption(option.id)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 dark:text-gray-200 hover:bg-kredivo-light dark:hover:bg-kredivo-primary/20"
            >
              <span className={`block truncate ${selectedOption?.id === option.id ? 'font-semibold' : 'font-normal'}`}>
                {option.name}
              </span>
              {selectedOption?.id === option.id && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-kredivo-primary">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};