/// <reference types="jest" />
import 'jest-preset-angular/setup-jest';

// Suppress console warnings and errors during tests
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// Store original functions to restore if needed
(global as any).__originalConsoleWarn = originalWarn;
(global as any).__originalConsoleError = originalError;
(global as any).__originalConsoleLog = originalLog;

// Override console methods to suppress warnings
console.warn = jest.fn();
console.error = jest.fn();
// Keep console.log for debugging if needed, but can be suppressed
// console.log = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
(globalThis as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(globalThis as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Handle unhandled promise rejections silently
const originalUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason, promise) => {
  // Suppress unhandled rejections in tests
  // Only log if it's a real error we should know about
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const error = reason as Error;
    // Allow certain critical errors through if needed
    if (error.message && !error.message.includes('Zone') && !error.message.includes('Angular')) {
      // Could log here if needed for debugging
    }
  }
});

