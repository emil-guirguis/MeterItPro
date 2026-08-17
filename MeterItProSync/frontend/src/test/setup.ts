import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// jsdom doesn't implement matchMedia — required by MUI responsive hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// ResizeObserver is used by MUI — must be a regular function so `new ResizeObserver()` works
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(function (this: any) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
});

// Suppress console noise in test output
(globalThis as any).console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Reset localStorage between tests so store initial state is clean
beforeEach(() => {
  localStorage.clear();
});
