/**
 * QuickStarters Component
 * 
 * Displays quick-start conversation buttons for common election questions.
 * Allows users to quickly start a guided conversation about specific topics.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when starter button is clicked
 * @returns {JSX.Element} Grid of starter buttons
 */

import React from 'react';
import { Vote, Calendar, MapPin, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * QuickStarters Component
 * 
 * Renders interactive buttons for quick conversation starters.
 * Each button initiates a conversation with a predefined context.
 * 
 * Accessibility Features:
 * - Semantic button elements for keyboard navigation
 * - Clear, descriptive labels
 * - Focus ring styles for visibility
 * - Proper ARIA labels
 * - High contrast design
 */
const QuickStarters = React.memo(({ onSelect }) => {
  /**
   * Quick starter configuration
   * Each starter defines a topic, icon, suggested message, and context
   */
  const starters = [
    {
      id: 'registration',
      title: 'How to register to vote',
      icon: <Vote className="w-6 h-6 text-blue-400" aria-hidden="true" />,
      text: 'How do I register to vote for the first time?',
      context: 'first_time_voter'
    },
    {
      id: 'timeline',
      title: 'Election timeline & phases',
      icon: <Calendar className="w-6 h-6 text-purple-400" aria-hidden="true" />,
      text: 'What is the election timeline and what are the different phases?',
      context: 'general'
    },
    {
      id: 'voting_day',
      title: 'What happens on voting day?',
      icon: <MapPin className="w-6 h-6 text-green-400" aria-hidden="true" />,
      text: 'Can you explain what happens on voting day at the booth?',
      context: 'existing_voter'
    },
    {
      id: 'ask_anything',
      title: 'Ask anything about elections',
      icon: <HelpCircle className="w-6 h-6 text-orange-400" aria-hidden="true" />,
      text: 'I have some general questions about the Indian elections.',
      context: 'general'
    }
  ];

  /**
   * Handle starter button click
   * @param {Object} starter - The selected starter configuration
   */
  const handleStarterClick = (starter) => {
    onSelect(starter.text, starter.context);
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto mt-8 px-4"
      role="region"
      aria-label="Quick start conversation options"
    >
      {starters.map((starter, index) => (
        <motion.button
          key={starter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleStarterClick(starter)}
          className="flex items-center p-6 glass rounded-2xl hover:bg-white/10 transition-all duration-300 group text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#0f172a]"
          aria-label={`${starter.title}. Click to start a conversation`}
          type="button"
        >
          <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover:scale-110 transition-transform">
            {starter.icon}
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">{starter.title}</h3>
            <p className="text-gray-400 text-sm">Click to start a conversation</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
});

QuickStarters.displayName = 'QuickStarters';

export default QuickStarters;
