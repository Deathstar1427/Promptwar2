/**
 * GreetingScreen Component - Jan Shakti Welcome Screen
 * 
 * Accessible greeting screen with WCAG AA compliance
 */

import React from 'react';

const JAN_SHAKTI_LOGO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf";

interface GreetingScreenProps {
  onSelect: (message: string) => void;
}

const quickStarters = [
  { icon: 'how_to_reg', label: 'How to Register', action: 'Guide me through voter registration' },
  { icon: 'location_on', label: 'Find My Polling Booth', action: 'Help me find my polling booth' },
  { icon: 'fact_check', label: 'Check Eligibility', action: 'Check if I am eligible to vote' },
  { icon: 'groups', label: 'View Candidate List', action: 'Show me the candidate list' },
];

export default function GreetingScreen({ onSelect }: GreetingScreenProps) {
  const handleKeyDown = (e: React.KeyboardEvent, action: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(action);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center pb-16 relative"
      role="main"
      aria-label="Welcome to Jan-Shakti Election Assistant"
    >
      {/* Top Right Trust Badges - Fixed Position */}
      <div 
        className="fixed top-5 right-5 flex flex-col items-end gap-2 z-10 hidden md:flex" 
        role="group" 
        aria-label="Trust indicators"
      >
        <div 
          className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1"
          role="img"
          aria-label="Powered by Gemini AI"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">psychology</span>
          <span>Gemini Powered</span>
        </div>
        <div 
          className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1"
          role="img"
          aria-label="Follows ECI Guidelines 2024-25"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">gavel</span>
          <span>ECI Guidelines 2024-25</span>
        </div>
        <div 
          className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1"
          role="img"
          aria-label="Supports Hinglish language"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">translate</span>
          <span>Hinglish Supported</span>
        </div>
      </div>

      {/* Main Container */}
      <main 
        className="w-full max-w-[800px] px-5 flex flex-col items-center justify-center flex-1 pt-16 md:pt-0"
        role="region"
        aria-label="Get started"
      >
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <img 
            alt="Jan-Shakti Election Assistant Logo"
            src={JAN_SHAKTI_LOGO}
            className="w-[120px] h-[120px] rounded-full object-cover mb-6 shadow-sm border-4 border-surface-container-highest"
            role="img"
          />
          <h1 
            className="text-[40px] font-serif font-bold text-primary-container max-w-[600px] leading-tight"
            style={{ fontFamily: 'Noto Serif, serif', lineHeight: 1.2 }}
          >
            Namaste! How can I help you vote today?
          </h1>
        </div>

        {/* Quick Starters Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[600px] mb-10"
          role="group"
          aria-label="Quick start options"
        >
          {quickStarters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelect(starter.action)}
              onKeyDown={(e) => handleKeyDown(e, starter.action)}
              className="bg-surface-container-lowest border-2 border-primary-container text-primary-container rounded-full px-6 py-3 flex items-center justify-center gap-2 btn-ledge border-b-primary-container hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-cyan-600"
              role="button"
              aria-label={`${starter.label}: ${starter.action}`}
              tabIndex={0}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                {starter.icon}
              </span>
              <span className="font-bold">{starter.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}