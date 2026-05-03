/**
 * GreetingScreen Component - Jan Shakti Welcome Screen
 * 
 * Exact copy of the HTML greeting screen design
 */

import React from 'react';

const JAN_SHAKTI_LOGO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCAWUkhlcp1ppV3tkKz-czAq2JjB6jeNrIhC-h8DlW2Scjj-o6qEUuSWQPY_EmMD8cM8FL60bQNQ7RM6mhgKUweHVh8QS_wSLy47_F-C0Fn_AOVxm5DG2nCWanH72OAriXEhNCK6Aq2jFlqAspds88V2gEJzZN3gYXDNczxrtfEj9RVwAiBfqnCL-eZzFSxOfWhPuQhhmXg0oaE12jrqwFtACH1Xk0J-jx9kLsfEjMok03l8a3vRgjF8lC3LfH9jUk63CPn6in-VrIf";

export default function GreetingScreen({ onSelect }) {
  const quickStarters = [
    { icon: 'how_to_reg', label: 'How to Register', action: 'Guide me through voter registration' },
    { icon: 'location_on', label: 'Find My Polling Booth', action: 'Help me find my polling booth' },
    { icon: 'fact_check', label: 'Check Eligibility', action: 'Check if I am eligible to vote' },
    { icon: 'groups', label: 'View Candidate List', action: 'Show me the candidate list' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center pb-16 relative">
      {/* Top Right Trust Badges - Fixed Position */}
      <div className="fixed top-5 right-5 flex flex-col items-end gap-2 z-10 hidden md:flex">
        <div className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          Gemini Powered
        </div>
        <div className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          ECI Guidelines 2024-25
        </div>
        <div className="bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>translate</span>
          Hinglish Supported
        </div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-[800px] px-5 flex flex-col items-center justify-center flex-1 pt-16 md:pt-0">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <img 
            alt="Jan-Shakti Logo" 
            src={JAN_SHAKTI_LOGO}
            className="w-[120px] h-[120px] rounded-full object-cover mb-6 shadow-sm border-4 border-surface-container-highest"
          />
          <h1 className="text-[40px] font-serif font-bold text-primary-container max-w-[600px] leading-tight" style={{ fontFamily: 'Noto Serif, serif', lineHeight: 1.2 }}>
            Namaste! How can I help you vote today?
          </h1>
        </div>

        {/* Quick Starters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[600px] mb-10">
          {quickStarters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelect(starter.action)}
              className="bg-surface-container-lowest border-2 border-primary-container text-primary-container rounded-full px-6 py-3 flex items-center justify-center gap-2 btn-ledge border-b-primary-container hover:bg-surface-container-low focus:outline-none"
              style={{ fontFamily: 'Public Sans, sans-serif' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{starter.icon}</span>
              <span className="font-bold">{starter.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Fixed Input Area - Only show after starting is handled by parent */}
    </div>
  );
}