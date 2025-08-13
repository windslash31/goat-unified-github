import React from "react";

export const SegmentedControl = ({ value, onChange, options }) => {
  return (
    <div className="inline-flex p-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60">
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              isActive
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};
