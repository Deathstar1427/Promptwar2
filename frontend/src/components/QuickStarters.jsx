import React from 'react';
import { Vote, Calendar, MapPin, MessageSquareQuestion } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickStarters = ({ onSelect }) => {
  const starters = [
    {
      id: 'registration',
      title: 'How to register to vote',
      icon: <Vote className="w-6 h-6 text-blue-400" />,
      text: 'How do I register to vote for the first time?',
      context: 'first_time_voter'
    },
    {
      id: 'timeline',
      title: 'Election timeline & phases',
      icon: <Calendar className="w-6 h-6 text-purple-400" />,
      text: 'What is the election timeline and what are the different phases?',
      context: 'general'
    },
    {
      id: 'voting_day',
      title: 'What happens on voting day?',
      icon: <MapPin className="w-6 h-6 text-green-400" />,
      text: 'Can you explain what happens on voting day at the booth?',
      context: 'existing_voter'
    },
    {
      id: 'ask_anything',
      title: 'Ask anything about elections',
      icon: <MessageSquareQuestion className="w-6 h-6 text-orange-400" />,
      text: 'I have some general questions about the Indian elections.',
      context: 'general'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto mt-8 px-4">
      {starters.map((starter, index) => (
        <motion.button
          key={starter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(starter.text, starter.context)}
          className="flex items-center p-6 glass rounded-2xl hover:bg-white/10 transition-all duration-300 group text-left"
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
};

export default QuickStarters;
