import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export const AskGoatButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 bg-kredivo-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kredivo-primary z-50"
      aria-label="Ask G.O.A.T."
    >
      <Bot size={28} />
    </motion.button>
  );
};
