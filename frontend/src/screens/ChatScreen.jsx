/**
 * ChatScreen Component - Jan Shakti Active Chat Interface
 * 
 * Displays the active chat interface with message bubbles, typing indicator,
 * and error messages.
 */

import React from 'react';

/**
 * Helper to format message content as simple paragraphs
 */
function formatMessage(content) {
  if (!content) return null;
  
  // Split by double newlines to separate paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  if (paragraphs.length === 0) {
    // If no double newlines, try single newlines
    return content.split('\n').map((line, i) => (
      <span key={i} className="block">
        {line || <br />}
      </span>
    ));
  }
  
  return paragraphs.map((para, i) => {
    // Check if it's a numbered list
    if (para.match(/^\d+[\.\)]\s*/)) {
      return (
        <ol key={i} className="list-decimal list-inside space-y-1 ml-2">
          {para.split('\n').filter(l => l.trim()).map((line, j) => (
            <li key={j} className="text-on-surface">{line.replace(/^\d+[\.\)]\s*/, '')}</li>
          ))}
        </ol>
      );
    }
    // Check if it's a bullet list
    if (para.match(/^[-•*]\s*/)) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1 ml-2">
          {para.split('\n').filter(l => l.trim()).map((line, j) => (
            <li key={j} className="text-on-surface">{line.replace(/^[-•*]\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    // Regular paragraph - preserve line breaks
    return (
      <p key={i} className="text-on-surface">
        {para.split('\n').map((line, j) => (
          <React.Fragment key={j}>
            {line}
            {j < para.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

/**
 * ChatScreen Component
 * @param {Array} messages - Array of message objects
 * @param {boolean} loading - Whether AI is responding
 * @param {string} error - Error message if any
 * @param {React.Ref} messagesEndRef - Ref for auto-scrolling
 * @param {string} textSizeClass - Tailwind class for text size
 * @returns {JSX.Element}
 */
export default function ChatScreen({
  messages,
  loading,
  error,
  messagesEndRef,
  textSizeClass = 'text-base'
}) {
  return (
    <div className="flex-1 overflow-y-auto p-md space-y-md pb-32">
      {/* Date Header */}
      {messages.length === 0 && (
        <div className="flex justify-center my-md">
          <span className="bg-surface-dim text-on-surface-variant font-label-sm px-sm py-xs rounded-full">
            Today
          </span>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <div key={index}>
          {message.role === 'user' ? (
            // User Message
            <div className="flex items-end justify-end gap-md max-w-3xl ml-auto mb-md">
              <div className={`bg-primary text-on-primary font-body-lg p-md rounded-3xl rounded-br-xs shadow-sm ${textSizeClass}`}>
                {message.content}
              </div>
            </div>
          ) : (
            // AI Message
            <div className="flex items-start gap-md max-w-3xl mb-md">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf"
                alt="Jan-Shakti Avatar"
                className="w-10 h-10 rounded-full mt-sm shadow-sm border border-outline-variant flex-shrink-0"
              />
              <div className={`bg-surface text-on-surface font-body-lg p-md rounded-3xl rounded-bl-xs border border-outline-variant/30 shadow-sm space-y-2 ${textSizeClass}`}>
                {formatMessage(message.content)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {loading && (
        <div className="flex items-start gap-md max-w-3xl mb-md">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf"
            alt="Jan-Shakti Avatar"
            className="w-10 h-10 rounded-full mt-sm shadow-sm border border-outline-variant flex-shrink-0"
          />
          <div className="bg-surface p-md rounded-3xl rounded-bl-xs border border-outline-variant/30 shadow-sm flex items-center gap-xs w-24 h-16">
            <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-error-container text-on-error-container font-body-md p-md rounded-2xl border border-error/30 max-w-2xl">
          {error}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}