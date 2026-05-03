/**
 * ChatScreen Component Tests
 * 
 * Tests for message rendering, accessibility, and functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChatScreen from '../screens/ChatScreen';

describe('ChatScreen', () => {
  let mockRef;
  
  beforeEach(() => {
    mockRef = { current: null };
  });
  
  const mockMessages = [
    { role: 'user', content: 'How do I register to vote?' },
    { role: 'assistant', content: 'To register, visit voters.eci.gov.in and fill Form 6.\n\nSteps:\n1. Visit the portal\n2. Fill your details\n3. Upload documents\n4. Submit' }
  ];
  
  it('renders user message correctly', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    expect(screen.getByText('How do I register to vote?')).toBeInTheDocument();
  });
  
  it('renders AI response correctly', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    expect(screen.getByText(/To register/)).toBeInTheDocument();
  });
  
  it('renders numbered lists correctly', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    // Check for list items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });
  
  it('shows loading indicator when loading is true', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={true} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    expect(screen.getByLabelText(/thinking/i)).toBeInTheDocument();
  });
  
  it('shows error message when error is present', () => {
    const errorMessage = 'Network error occurred';
    
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={errorMessage}
        messagesEndRef={mockRef}
      />
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('displays date header when no messages', () => {
    render(
      <ChatScreen 
        messages={[]} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
  
  it('has proper accessibility roles for messages', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    // Check for article role on messages
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBe(2);
  });
  
  it('has aria-live region for dynamic content', () => {
    render(
      <ChatScreen 
        messages={mockMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });
  
  it('renders bullet points correctly', () => {
    const bulletMessages = [
      { role: 'assistant', content: 'Options:\n- Option A\n- Option B\n- Option C' }
    ];
    
    render(
      <ChatScreen 
        messages={bulletMessages} 
        loading={false} 
        error={null}
        messagesEndRef={mockRef}
      />
    );
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(3);
  });
});