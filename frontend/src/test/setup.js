/**
 * Vitest Test Setup
 * 
 * This file sets up the testing environment for all tests.
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll, vi } from 'vitest';

// Mock window.matchMedia for components that use it
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });
  
  // Mock navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
});

// Mock fetch globally
beforeAll(() => {
  global.fetch = vi.fn();
});

afterAll(() => {
  vi.clearAllMocks();
});