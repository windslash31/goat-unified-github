import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import api from "../../api/api";
import toast from "react-hot-toast";

export const AskGoatModal = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! How can I help you today? Ask me about employees, activity, or platform stats.",
    },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const newMessages = [...messages, { from: "user", text: prompt }];
    setMessages(newMessages);
    setPrompt("");
    setIsLoading(true);

    try {
      // --- MODIFIED: Send the entire conversation history ---
      const { data } = await api.post("/api/ai/ask", { history: newMessages });
      setMessages((prev) => [...prev, { from: "bot", text: data.response }]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "The AI is unavailable right now."
      );
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Sorry, I am having trouble connecting. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of the component JSX remains the same...
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bot /> Ask G.O.A.T.
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    msg.from === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.from === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-kredivo-light flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-kredivo-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                      msg.from === "bot"
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "bg-kredivo-primary text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.from === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-kredivo-light flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-kredivo-primary" />
                  </div>
                  <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0"
            >
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full px-4 py-2 pr-12 border rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-kredivo-primary text-white hover:bg-kredivo-primary-hover disabled:bg-gray-400"
                  disabled={isLoading || !prompt.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
