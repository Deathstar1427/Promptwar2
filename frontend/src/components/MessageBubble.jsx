import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "ml-3 bg-blue-600" : "mr-3 bg-gray-700"}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>
        
        <div className={`px-4 py-3 rounded-2xl text-sm md:text-base whitespace-pre-wrap leading-relaxed shadow-lg ${
          isUser 
            ? "bg-blue-600 text-white rounded-tr-none" 
            : "glass-dark text-gray-100 rounded-tl-none border-blue-500/20 border"
        }`}>
          {message.content}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
