/**
 * Jest test setup file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://test.atlassian.net';
process.env.JIRA_EMAIL = process.env.JIRA_EMAIL || 'test@example.com';
process.env.JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || 'test-token';
process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'test-key';

// Global test timeout
jest.setTimeout(30000);

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log errors and important messages during tests
  if (args.some(arg => typeof arg === 'string' && (arg.includes('ERROR') || arg.includes('FAIL')))) {
    originalConsoleLog(...args);
  }
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup after all tests
afterAll(async () => {
  // Allow time for any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});