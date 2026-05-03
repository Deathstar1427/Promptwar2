/**
 * App Component - Jan Shakti Election Assistant
 * 
 * Accessible React component with WCAG AA compliance
 * Features: aria-labels, roles, keyboard navigation, color contrast
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import GreetingScreen from './screens/GreetingScreen';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const JAN_SHAKTI_LOGO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState(null);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [textSize, setTextSize] = useState('standard');
  const [language, setLanguage] = useState('english');

  const messagesEndRef = useRef(null);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const getErrorMessage = useCallback((err: Error, statusCode: number) => {
    if (statusCode === 429) {
      return "Too many requests. Please wait a moment before sending another message.";
    }
    if (statusCode === 503) {
      return "The service is temporarily unavailable. Please try again in a moment.";
    }
    if (err?.message === 'Failed to fetch' || !navigator.onLine) {
      return "Please check your internet connection and try again.";
    }
    return "I'm having trouble connecting. Please try again later.";
  }, []);

  const handleSend = useCallback(async (messageText?: string) => {
    const finalMessage = messageText || input;
    
    if (!finalMessage.trim()) {
      return;
    }

    if (!isStarted) {
      setIsStarted(true);
    }

    const userMessage = { role: 'user', content: finalMessage };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    const timeoutHandle = setTimeout(() => {
      abortControllerRef.current?.abort();
      setLoading(false);
    }, 15000);
    timeoutRef.current = timeoutHandle;

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          history: nextHistory,
          language: language
        }),
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const errorMessage = getErrorMessage(null, response.status);
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      clearTimeout(timeoutHandle);

      if (err?.name === 'AbortError') {
        const errorMessage = "Request timed out. Please try again with a shorter message.";
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        setError(errorMessage);
      } else {
        const errorMessage = getErrorMessage(err as Error, 0);
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [input, isStarted, messages, language, getErrorMessage]);

  const handleRestart = useCallback(() => {
    setMessages([]);
    setIsStarted(false);
    setInput('');
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  }, [handleSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  }, [handleSend]);

  // Helper function to format message content
  const formatMessage = (content: string) => {
    if (!content) return null;
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map((para, i) => {
      if (para.match(/^\d+[\.\)]\s*/)) {
        return (
          <ol key={i} className="list-decimal list-inside space-y-1 ml-2">
            {para.split('\n').filter(l => l.trim()).map((line, j) => (
              <li key={j}>{line.replace(/^\d+[\.\)]\s*/, '')}</li>
            ))}
          </ol>
        );
      }
      if (para.match(/^[-•*]\s*/)) {
        return (
          <ul key={i} className="list-disc list-inside space-y-1 ml-2">
            {para.split('\n').filter(l => l.trim()).map((line, j) => (
              <li key={j}>{line.replace(/^[-•*]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      return <p key={i} className="mb-2">{para}</p>;
    });
  };

  // Focus input when chat starts
  useEffect(() => {
    if (isStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStarted]);

  return (
    <ErrorBoundary>
      <div 
        className="flex flex-col h-screen w-full bg-[#FEFCE8] text-[#131b2e] overflow-hidden font-sans" 
        role="application"
        aria-label="Jan-Shakti Election Assistant"
      >
        
        {/* Header - Only show when chat started */}
        {isStarted && (
          <header 
            className="flex justify-between items-center w-full px-6 py-4 bg-white border-b-4 border-cyan-800/10 shadow-sm z-50"
            role="banner"
            aria-label="Application header"
          >
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black text-cyan-700 font-serif">
                Jan-Shakti Election Assistant
              </h1>
            </div>
            <nav className="flex gap-4 items-center" role="navigation" aria-label="Main navigation">
              <button 
                onClick={handleRestart}
                className="font-serif font-bold text-lg text-cyan-700 hover:bg-cyan-50 px-4 py-2 rounded-full border-b-4 border-cyan-800 active:translate-y-0.5 active:border-b-2 transition-all"
                aria-label="Start a new chat session"
              >
                New Chat
              </button>
              <button 
                onClick={() => setShowAccessibility(true)}
                className="font-serif font-bold text-lg text-slate-600 hover:bg-cyan-50 px-4 py-2 rounded-full"
                aria-label="Open accessibility settings"
              >
                Accessibility
              </button>
              <div className="flex gap-2" role="group" aria-label="Trust indicators">
                <span 
                  className="material-symbols-outlined text-slate-600 hover:text-cyan-700 cursor-pointer p-2 rounded-full hover:bg-slate-100" 
                  role="img" 
                  aria-label="Verified and secure"
                >
                  verified_user
                </span>
                <span 
                  className="material-symbols-outlined text-slate-600 hover:text-cyan-700 cursor-pointer p-2 rounded-full hover:bg-slate-100" 
                  role="img" 
                  aria-label="Language support available"
                >
                  g_translate
                </span>
                <span 
                  className="material-symbols-outlined text-slate-600 hover:text-cyan-700 cursor-pointer p-2 rounded-full hover:bg-slate-100" 
                  role="img" 
                  aria-label="Information"
                >
                  info
                </span>
              </div>
            </nav>
          </header>
        )}

        {/* Main Content Area */}
        <main 
          className="flex-1 flex overflow-hidden" 
          role="main" 
          aria-label="Chat content"
        >
          
          {/* Greeting Screen - When not started */}
          {!isStarted && (
            <GreetingScreen onSelect={handleSend} />
          )}

          {/* Chat Screen - When started */}
          {isStarted && (
            <div className="flex-1 flex flex-col h-full">
              {/* Messages Container */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-6 pb-40"
                role="log" 
                aria-label="Chat messages"
                aria-live="polite"
              >
                {/* Date Header */}
                {messages.length === 0 && (
                  <div className="flex justify-center my-4">
                    <span className="bg-slate-200 text-slate-600 text-xs px-4 py-1 rounded-full" aria-label="Current date">
                      Today
                    </span>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => (
                  <div key={index} role="article" aria-label={`${message.role === 'user' ? 'Your message' : 'Jan-Shakti response'} ${index + 1}`}>
                    {message.role === 'user' ? (
                      // User Message - Teal with white text (WCAG AA contrast)
                      <div className="flex items-end justify-end gap-4 max-w-3xl ml-auto">
                        <div 
                          className="bg-[#005a71] text-white p-5 rounded-[24px] rounded-br-[4px] shadow-sm"
                          role="textbox"
                          aria-label="Your message"
                        >
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      // AI Message - White with dark text (WCAG AA contrast)
                      <div className="flex items-start gap-4 max-w-3xl">
                        <img
                          src={JAN_SHAKTI_LOGO}
                          alt="Jan-Shakti AI Assistant"
                          className="w-10 h-10 rounded-full mt-2 shadow-sm border border-slate-300"
                          role="img"
                        />
                        <div 
                          className="bg-white text-[#131b2e] p-5 rounded-[24px] rounded-bl-[4px] border border-slate-200/30 shadow-sm space-y-4"
                          role="textbox"
                          aria-label="Jan-Shakti response"
                        >
                          {formatMessage(message.content)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {loading && (
                  <div className="flex items-start gap-4 max-w-3xl" aria-label="Jan-Shakti is thinking">
                    <img
                      src={JAN_SHAKTI_LOGO}
                      alt=""
                      className="w-10 h-10 rounded-full mt-2 shadow-sm border border-slate-300"
                      role="img"
                      aria-hidden="true"
                    />
                    <div 
                      className="bg-white p-5 rounded-[24px] rounded-bl-[4px] border border-slate-200/30 shadow-sm flex items-center gap-1 w-20 h-[68px]"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
                      <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
                      <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </main>

        {/* Fixed Input Area - Bottom */}
        <div 
          className="fixed bottom-0 left-0 w-full p-5 flex justify-center bg-gradient-to-t from-[#FEFCE8] via-[#FEFCE8] to-transparent z-20 pb-5"
          role="form"
          aria-label="Message input form"
        >
          <div className="w-full max-w-[800px] relative">
            {/* Quick Replies - Only show when chat started */}
            {isStarted && (
              <div 
                className="flex gap-3 mb-4 overflow-x-auto pb-2 px-1"
                role="group" 
                aria-label="Quick reply suggestions"
              >
                <button 
                  onClick={() => handleSend('Find my polling booth')}
                  className="whitespace-nowrap bg-[#E1F5FE] text-[#0e7490] font-bold px-5 py-2.5 rounded-full border-b-2 border-[#0A5A70]/20 hover:bg-[#B3E5FC] active:translate-y-0.5 active:border-b-0 transition-all"
                  aria-label="Find my polling booth - quick reply"
                >
                  Find Polling Booth
                </button>
                <button 
                  onClick={() => handleSend('Check my registration')}
                  className="whitespace-nowrap bg-[#E1F5FE] text-[#0e7490] font-bold px-5 py-2.5 rounded-full border-b-2 border-[#0A5A70]/20 hover:bg-[#B3E5FC] active:translate-y-0.5 active:border-b-0 transition-all"
                  aria-label="Check my registration - quick reply"
                >
                  Check Registration
                </button>
                <button 
                  onClick={() => handleSend('What are the election dates')}
                  className="whitespace-nowrap bg-[#E1F5FE] text-[#0e7490] font-bold px-5 py-2.5 rounded-full border-b-2 border-[#0A5A70]/20 hover:bg-[#B3E5FC] active:translate-y-0.5 active:border-b-0 transition-all"
                  aria-label="What are the election dates - quick reply"
                >
                  Election Dates
                </button>
              </div>
            )}

            {/* Input Field - Submit via Enter key */}
            <div 
              className="bg-white rounded-full shadow-[0px_10px_30px_rgba(234,88,12,0.08)] flex items-center p-2 border border-slate-200/20"
              role="search"
            >
              <button 
                className="p-3 text-slate-400 hover:text-cyan-700 transition-colors rounded-full hover:bg-slate-50"
                aria-label="Add attachment"
              >
                <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about voting..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[#131b2e] px-4 py-3 placeholder:text-slate-400/60 outline-none"
                disabled={loading}
                aria-label="Type your message"
                aria-describedby="input-hint"
                role="searchbox"
                enterKeyHint="send"
              />
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="p-3 bg-[#bc4200] text-white rounded-full hover:opacity-90 transition-opacity ml-2 w-12 h-12 flex items-center justify-center border-b-4 border-b-[#7f2b00] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">send</span>
              </button>
            </div>

            {/* Footer Text */}
            <div className="text-center mt-2" role="contentinfo">
              <p id="input-hint" className="text-xs text-slate-400/70">
                Press Enter to send your message. Jan-Shakti AI can make mistakes. Check official ECI sources.
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility Settings Panel */}
        {showAccessibility && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
              onClick={() => setShowAccessibility(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Accessibility settings panel"
            />
            <aside 
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-[0px_10px_30px_rgba(234,88,12,0.08)] z-50 rounded-l-[24px] flex flex-col border-l border-slate-200/30"
              role="complementary"
              aria-label="Settings"
            >
              <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-[#005a71]" aria-hidden="true">settings_accessibility</span>
                  <h2 className="text-2xl font-serif font-semibold text-[#005a71]">Settings</h2>
                </div>
                <button 
                  onClick={() => setShowAccessibility(false)} 
                  className="p-2 -mr-2 rounded-full hover:bg-slate-50 text-slate-500"
                  aria-label="Close settings"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section className="space-y-3" aria-labelledby="text-size-label">
                  <div className="flex justify-between items-baseline">
                    <label id="text-size-label" className="font-bold text-[#131b2e]">Text Size</label>
                    <span className="text-xs text-[#005a71] px-2 py-1 bg-[#b9eaff] rounded-full">
                      {textSize.charAt(0).toUpperCase() + textSize.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2" role="radiogroup" aria-label="Text size options">
                    {['small', 'standard', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setTextSize(size)}
                        className={`flex-1 py-2 px-3 rounded-full font-bold border-b-2 transition-all ${
                          textSize === size
                            ? 'bg-[#005a71] text-white border-b-[#053d4c]'
                            : 'bg-slate-100 text-slate-600 border-b-slate-300'
                        }`}
                        role="radio"
                        aria-checked={textSize === size}
                        aria-label={`${size} text size`}
                      >
                        {size === 'small' ? 'A' : size === 'standard' ? 'A+' : 'A++'}
                      </button>
                    ))}
                  </div>
                </section>

                <hr className="border-slate-200/20" />

                <section className="space-y-3" aria-labelledby="language-label">
                  <label id="language-label" className="font-bold text-[#131b2e]">Language</label>
                  <div 
                    className="flex p-1 bg-slate-100 rounded-full border border-slate-200/10" 
                    role="radiogroup" 
                    aria-label="Language preference"
                  >
                    <button
                      onClick={() => setLanguage('english')}
                      className={`flex-1 py-2 text-center rounded-full font-bold transition-all border-b-2 ${
                        language === 'english'
                          ? 'bg-white shadow-sm text-[#005a71] border-b-[#005a71]'
                          : 'text-slate-500 border-b-transparent'
                      }`}
                      role="radio"
                      aria-checked={language === 'english'}
                      aria-label="English language"
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('hinglish')}
                      className={`flex-1 py-2 text-center rounded-full font-bold transition-all border-b-2 ${
                        language === 'hinglish'
                          ? 'bg-white shadow-sm text-[#005a71] border-b-[#005a71]'
                          : 'text-slate-500 border-b-transparent'
                      }`}
                      role="radio"
                      aria-checked={language === 'hinglish'}
                      aria-label="Hinglish language"
                    >
                      Hinglish
                    </button>
                  </div>
                </section>
              </div>

              <div className="p-6 pt-5 border-t border-slate-200/20 bg-slate-50 rounded-bl-[24px]">
                <button
                  onClick={() => setShowAccessibility(false)}
                  className="w-full py-3 px-6 bg-[#005a71] text-white rounded-full font-bold border-b-4 border-b-[#003d4c] active:translate-y-0.5 active:border-b-2 hover:bg-[#0e7490] transition-all flex items-center justify-center gap-2 shadow-sm"
                  aria-label="Apply and close settings"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  Apply Changes
                </button>
                <p className="text-center text-xs text-slate-500 mt-3">Settings apply immediately.</p>
              </div>
            </aside>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;