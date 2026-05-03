/**
 * GreetingScreen Component Tests
 * 
 * Tests for accessibility, functionality, and rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GreetingScreen from '../screens/GreetingScreen';

describe('GreetingScreen', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    mockOnSelect.mockClear();
  });
  
  it('renders the welcome heading', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    expect(screen.getByText(/Namaste/i)).toBeInTheDocument();
  });
  
  it('renders all four quick starter buttons', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    expect(screen.getByText('How to Register')).toBeInTheDocument();
    expect(screen.getByText('Find My Polling Booth')).toBeInTheDocument();
    expect(screen.getByText('Check Eligibility')).toBeInTheDocument();
    expect(screen.getByText('View Candidate List')).toBeInTheDocument();
  });
  
  it('calls onSelect with correct action when button clicked', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('How to Register'));
    
    expect(mockOnSelect).toHaveBeenCalledWith('Guide me through voter registration');
  });
  
  it('calls onSelect when Enter key pressed on button', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    const button = screen.getByText('Find My Polling Booth');
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSelect).toHaveBeenCalledWith('Help me find my polling booth');
  });
  
  it('renders trust badges with correct accessibility', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    expect(screen.getByLabelText(/Powered by Gemini AI/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ECI Guidelines/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hinglish/i)).toBeInTheDocument();
  });
  
  it('has proper role attributes', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    // Check main container has proper role
    expect(document.querySelector('[role="main"]')).toBeInTheDocument();
  });
  
  it('renders the logo with alt text', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    const logo = screen.getByAltText(/Jan-Shakti.*Logo/i);
    expect(logo).toBeInTheDocument();
  });
  
  it('renders all buttons as keyboard accessible', () => {
    render(<GreetingScreen onSelect={mockOnSelect} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });
});