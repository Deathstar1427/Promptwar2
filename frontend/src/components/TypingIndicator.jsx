import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 px-4 py-3 glass-dark rounded-2xl rounded-tl-none w-16 mb-6">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
      />
    </div>
  );
};

export default TypingIndicator;
