/**
 * TypingIndicator Component
 * 
 * Animated typing indicator shown while waiting for assistant response.
 * Displays three animated dots to indicate that the AI is generating a response.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.prefersReducedMotion - User's motion preference
 * @returns {JSX.Element} Animated typing indicator
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * TypingIndicator Component
 * 
 * Shows a loading animation while waiting for API response.
 * Respects user's reduced motion preferences.
 * 
 * Accessibility Features:
 * - aria-busy to indicate loading state
 * - Descriptive label for screen readers
 * - Semantic HTML structure
 */
const TypingIndicator = React.memo(({ prefersReducedMotion }) => {
  const animationDuration = prefersReducedMotion ? 0.1 : 0.6;

  return (
    <div
      className="flex items-center space-x-2 px-4 py-3 glass-dark rounded-2xl rounded-tl-none w-16 mb-6"
      role="status"
      aria-busy="true"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{ scale: prefersReducedMotion ? [1, 1, 1] : [1, 1.2, 1] }}
          transition={{
            repeat: Infinity,
            duration: animationDuration,
            delay: index * 0.2
          }}
          className="w-1.5 h-1.5 bg-blue-400 rounded-full"
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
