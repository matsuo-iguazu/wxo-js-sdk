// Jest setup file
// This file runs before each test suite

// Mock browser APIs if needed
global.fetch = jest.fn();
global.WebSocket = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Made with Bob
