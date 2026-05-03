/**
 * ChatScreen Component - Jan Shakti Active Chat Interface
 * 
 * Accessible chat display with WCAG AA compliance
 */

import React from 'react';

const JAN_SHAKTI_LOGO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf";

interface Message {
  role: string;
  content: string;
}

interface ChatScreenProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function formatMessage(content: string): React.ReactNode {
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
}

export default function ChatScreen({
  messages,
  loading,
  error,
  messagesEndRef
}: ChatScreenProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto p-6 space-y-6 pb-40"
      role="log" 
      aria-label="Chat messages"
      aria-live="polite"
    >
      {/* Date Header */}
      {messages.length === 0 && (
        <div className="flex justify-center my-4">
          <span 
            className="bg-slate-200 text-slate-600 text-xs px-4 py-1 rounded-full"
            aria-label="Current date: Today"
          >
            Today
          </span>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <div 
          key={index}
          role="article"
          aria-label={`${message.role === 'user' ? 'Your message' : 'Jan-Shakti response'} ${index + 1}`}
        >
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
                alt=""
                className="w-10 h-10 rounded-full mt-2 shadow-sm border border-slate-300"
                role="img"
                aria-hidden="true"
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
        <div 
          className="flex items-start gap-4 max-w-3xl"
          role="status"
          aria-live="polite"
          aria-label="Jan-Shakti is thinking"
        >
          <img
            src={JAN_SHAKTI_LOGO}
            alt=""
            className="w-10 h-10 rounded-full mt-2 shadow-sm border border-slate-300"
            role="img"
            aria-hidden="true"
          />
          <div 
            className="bg-white p-5 rounded-[24px] rounded-bl-[4px] border border-slate-200/30 shadow-sm flex items-center gap-1 w-20 h-[68px]"
          >
            <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
            <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
            <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full typing-dot" aria-hidden="true"></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200"
          role="alert"
          aria-label="Error message"
        >
          {error}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}