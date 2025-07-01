import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Portal } from './Portal';

export const CustomSelect = ({ options, value, onChange, placeholder = "Select...", id = null, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const DropdownList = (
    <ul 
      ref={dropdownRef}
      style={{ 
        position: 'absolute',
        top: `${position.top}px`, 
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      className="z-50 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto focus:outline-none"
    >
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
  );

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={buttonRef}>
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 flex items-center justify-between text-left focus:ring-kredivo-primary focus:border-kredivo-primary focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}`}>{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && <Portal>{DropdownList}</Portal>}
    </div>
  );
};