import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, RefreshCw, Info, Vote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickStarters from './components/QuickStarters';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('general');
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text, customContext) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    if (!isStarted) setIsStarted(true);

    const userMessage = { role: 'user', content: messageText };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    const currentContext = customContext || context;
    if (customContext) setContext(customContext);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: nextHistory,
          context: currentContext
        }),
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setIsStarted(false);
    setContext('general');
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Vote size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Election <span className="gradient-text">Assistant</span></h1>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Gemini 1.5 Flash Powered</span>
            </div>
          </div>
        </div>
        
        {isStarted && (
          <button 
            onClick={handleRestart}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
            title="Restart Session"
          >
            <RefreshCw size={20} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-8">
        {!isStarted ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20 animate-float"
            >
              <Sparkles className="w-10 h-10 text-blue-400" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-extrabold mb-4"
            >
              How can I help you <span className="gradient-text">vote today?</span>
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-lg max-w-xl mb-12"
            >
              Your personal guide to the Indian Elections. Ask in English or Hinglish about registration, timelines, and more.
            </motion.p>
            
            <QuickStarters onSelect={handleSend} />
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
            </AnimatePresence>
            
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 z-50 glass-dark border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStarted ? "Ask a follow-up question..." : "Type your question here..."}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-gray-100 placeholder:text-gray-500 shadow-2xl"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-blue-600/30 text-white"
            >
              <Send size={20} />
            </button>
          </form>
          
          <div className="mt-3 flex items-center justify-center space-x-4 text-[11px] text-gray-500">
            <span className="flex items-center"><Info size={12} className="mr-1" /> ECI Guidelines 2024-25</span>
            <span className="flex items-center font-medium text-blue-500/80 uppercase">Hinglish Supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
