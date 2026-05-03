/**
 * MessageBubble Component
 * 
 * Renders a single message in the chat conversation.
 * Displays different styles for user vs assistant messages.
 * Includes animations respecting user's motion preferences.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object with role and content
 * @param {boolean} props.prefersReducedMotion - User's motion preference
 * @returns {JSX.Element} Animated message bubble
 */

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

/**
 * MessageBubble Component
 * 
 * Displays a chat message with appropriate styling and animation.
 * Supports both user and assistant messages with different visual treatment.
 * 
 * Accessibility Features:
 * - Semantic HTML structure
 * - Icons with aria-hidden for screen readers
 * - Clear role identification
 * - High contrast colors for readability
 */
const MessageBubble = React.memo(({ message, prefersReducedMotion }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{
        opacity: prefersReducedMotion ? 1 : 0,
        x: prefersReducedMotion ? 0 : (isUser ? 20 : -20)
      }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut"
      }}
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
      role={isUser ? "status" : "status"}
      aria-live="polite"
    >
      <div
        className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "ml-3 bg-blue-600" : "mr-3 bg-gray-700"
          }`}
          aria-label={isUser ? "Your message" : "Assistant response"}
        >
          {isUser ? (
            <User size={18} className="text-white" aria-hidden="true" />
          ) : (
            <Bot size={18} className="text-white" aria-hidden="true" />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm md:text-base whitespace-pre-wrap leading-relaxed shadow-lg ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "glass-dark text-gray-100 rounded-tl-none border-blue-500/20 border"
          }`}
          role="article"
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
