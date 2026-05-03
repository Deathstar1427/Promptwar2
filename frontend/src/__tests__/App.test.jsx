/**
 * App Component Tests
 *
 * Test suite for the main App component using Vitest and React Testing Library.
 * Covers rendering, user interactions, API communication, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch globally
global.fetch = vi.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render without crashing', () => {
    render(<App />);
    // Check for main header elements
    expect(screen.getByText(/Election/i)).toBeInTheDocument();
    expect(screen.getByText(/Assistant/i)).toBeInTheDocument();
  });

  it('should render chat input field', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Type your question here/i);
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('should not trigger API call when sending empty message', async () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const submitButton = screen.getByRole('button', { name: '' });
    
    // Try to submit with empty input
    await userEvent.click(submitButton);
    
    // Fetch should not have been called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not trigger API call with only whitespace', async () => {
    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    
    // Type whitespace only
    await userEvent.type(input, '   ');
    
    const form = input.closest('form');
    fireEvent.submit(form);
    
    // Fetch should not have been called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should render quick starter buttons', () => {
    render(<App />);
    
    // Check for quick starter buttons
    expect(screen.getByText(/How to register to vote/i)).toBeInTheDocument();
    expect(screen.getByText(/Election timeline & phases/i)).toBeInTheDocument();
    expect(screen.getByText(/What happens on voting day/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask anything about elections/i)).toBeInTheDocument();
  });

  it('should make API call when quick starter button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Test response' })
    });

    render(<App />);
    
    // Find and click a quick starter button
    const registrationButton = screen.getByText(/How to register to vote/i);
    await userEvent.click(registrationButton);
    
    // Verify fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  it('should display response text after API call', async () => {
    const testReply = 'This is a test response about elections.';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: testReply })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    
    // Type and submit a message
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Wait for response to appear
    await waitFor(() => {
      expect(screen.getByText(testReply)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    
    // Type and submit a message
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
    });
  });

  it('should display loading indicator while waiting for response', async () => {
    fetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ reply: 'Response' })
      }), 100))
    );

    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    
    // Type and submit
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Check for loading state
    await waitFor(() => {
      const submitButton = form.querySelector('button[type="submit"]');
      expect(submitButton).toBeDisabled();
    });
  });

  it('should clear input after sending message', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Test response' })
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    
    // Type and submit
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Wait for input to clear
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should allow restart of conversation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Test response' })
    });

    render(<App />);
    
    // Start a conversation
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Wait for response and restart button to appear
    await waitFor(() => {
      const restartButton = screen.getByTitle(/Restart Session/i);
      expect(restartButton).toBeInTheDocument();
    });
    
    // Click restart
    const restartButton = screen.getByTitle(/Restart Session/i);
    await userEvent.click(restartButton);
    
    // Should return to initial state
    expect(screen.getByPlaceholderText(/Type your question here/i)).toBeInTheDocument();
  });

  it('should send message with context when quick starter is used', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Test response' })
    });

    render(<App />);
    
    // Click a quick starter button
    const registrationButton = screen.getByText(/How to register to vote/i);
    await userEvent.click(registrationButton);
    
    // Verify context was sent
    await waitFor(() => {
      const callData = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callData.context).toBe('first_time_voter');
    });
  });

  it('should disable input and button while loading', async () => {
    fetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ reply: 'Response' })
      }), 200))
    );

    render(<App />);
    
    const input = screen.getByPlaceholderText(/Type your question here/i);
    const form = input.closest('form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Type and submit
    await userEvent.type(input, 'What is voter registration?');
    fireEvent.submit(form);
    
    // Check both are disabled during loading
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
