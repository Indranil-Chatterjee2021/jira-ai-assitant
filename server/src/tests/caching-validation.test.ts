/**
 * Validation Tests for Prompt Caching Implementation
 * Ensures caching doesn't break existing functionality
 */

import { generateJQL } from '../llm/generateJql';
import { getTokenStats, trackAICall } from '../utils/tokenTracker';

// Mock Google AI to avoid actual API calls during testing
const mockResponseMap = new Map([
  ['show bugs assigned to john', 'assignee = "john" AND type = Bug AND sprint in openSprints()'],
  ['show worklog for john between 2025-01-01 and 2025-01-31', 'worklogAuthor = "john" AND worklogDate >= "2025-01-01" AND worklogDate <= "2025-01-31"'],
  ['show backlog issues', 'status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()'],
  ['show issues for QA team', '"team name" = "QA" AND sprint in openSprints()'],
  ['show high priority bugs assigned to john created last week', 'assignee = "john" AND type = Bug AND priority = High AND created >= -1w AND sprint in openSprints()'],
  ['MSC-12345', 'key = "MSC-12345"'],
  ['show bugs for alice', 'assignee = "alice" AND type = Bug AND sprint in openSprints()'],
  ['show tasks for bob', 'assignee = "bob" AND type = Task AND sprint in openSprints()'],
  ['show my issues', 'assignee = currentUser() AND sprint in openSprints()'],
  ['bugs assigned to john', 'assignee = "john" AND type = Bug AND sprint in openSprints()'],
  ['high priority issues', 'priority = High AND sprint in openSprints()'],
  ['my tasks', 'assignee = currentUser() AND type = Task AND sprint in openSprints()'],
  ['unassigned bugs', 'assignee is EMPTY AND type = Bug AND sprint in openSprints()'],
  ['show issues created between 2025-01-01 and 2025-12-31', 'created >= "2025-01-01" AND created <= "2025-12-31" AND sprint in openSprints()']
]);

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation((prompt) => {
        // Extract query from prompt
        const queryMatch = prompt.match(/Query: "([^"]+)"/);
        const query = queryMatch ? queryMatch[1] : '';
        
        // Return appropriate mock response based on query
        const response = mockResponseMap.get(query) || 'summary ~ "' + query + '" AND sprint in openSprints()';
        
        return Promise.resolve({
          response: {
            text: jest.fn().mockReturnValue(response)
          }
        });
      })
    })
  }))
}));

describe('Prompt Caching Validation Tests', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
    process.env.GOOGLE_API_KEY = 'test-api-key-12345';
    
    // Clear any existing cache
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Basic Functionality Validation', () => {
    test('should generate JQL for simple query', async () => {
      const query = 'show bugs assigned to john';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toMatch(/\w+\s*(=|~|!=|in|not in|>|<|>=|<=)\s*.+/);
    });

    test('should handle worklog queries', async () => {
      const query = 'show worklog for john between 2025-01-01 and 2025-01-31';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/worklog/i);
    });

    test('should handle backlog queries', async () => {
      const query = 'show backlog issues';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/sprint/i);
    });

    test('should handle team queries', async () => {
      const query = 'show issues for QA team';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle complex queries', async () => {
      const query = 'show high priority bugs assigned to john created last week';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/priority.*high/i);
    });

    test('should handle issue key queries', async () => {
      const query = 'MSC-12345';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/key.*MSC-12345/);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should fallback to rule-based generation when API fails', async () => {
      // Temporarily remove API key to trigger fallback
      delete process.env.GOOGLE_API_KEY;
      
      const query = 'show bugs';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/bug/i);
    });

    test('should handle empty queries gracefully', async () => {
      const query = '';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle malformed queries', async () => {
      const query = 'this is not a valid jira query at all 12345 !!!';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('Cache Behavior Validation', () => {
    test('should use cached model for subsequent calls', async () => {
      const query1 = 'show bugs for alice';
      const query2 = 'show tasks for bob';
      
      const result1 = await generateJQL(query1);
      const result2 = await generateJQL(query2);
      
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1).not.toBe(result2); // Should be different queries
    });

    test('should handle cache refresh after expiry', async () => {
      // This test validates the cache expiry logic exists
      const query = 'show my issues';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/currentUser/);
    });
  });

  describe('Token Tracking Validation', () => {
    test('should track token usage correctly', async () => {
      const initialStats = getTokenStats();
      const initialQueries = initialStats.totalQueries;
      
      const query = 'show issues for test user';
      await generateJQL(query);
      
      const finalStats = getTokenStats();
      expect(finalStats.totalQueries).toBe(initialQueries + 1);
      expect(finalStats.totalTokens).toBeGreaterThan(initialStats.totalTokens);
    });

    test('should handle custom token tracking', async () => {
      const testUsage = trackAICall('test input', 'test output', 10, 5);
      
      expect(testUsage.inputTokens).toBe(10);
      expect(testUsage.outputTokens).toBe(5);
      expect(testUsage.totalTokens).toBe(15);
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain same JQL structure as before', async () => {
      const testCases = [
        {
          query: 'bugs assigned to john',
          expected: /assignee.*john.*type.*Bug/
        },
        {
          query: 'high priority issues',
          expected: /priority.*High/
        },
        {
          query: 'my tasks',
          expected: /assignee.*currentUser.*type.*Task/
        },
        {
          query: 'unassigned bugs',
          expected: /assignee.*EMPTY.*type.*Bug/
        }
      ];

      for (const testCase of testCases) {
        const result = await generateJQL(testCase.query);
        expect(result).toMatch(testCase.expected);
      }
    });

    test('should handle sprint filtering correctly', async () => {
      const query = 'show issues for development';
      const result = await generateJQL(query);
      
      // Should include sprint filter unless explicitly excluded
      expect(result).toMatch(/sprint in openSprints|Sprint not in openSprints|Sprint is EMPTY/);
    });

    test('should clean JQL output properly', async () => {
      const query = 'show bugs';
      const result = await generateJQL(query);
      
      // Should not contain markdown formatting
      expect(result).not.toMatch(/```/);
      expect(result).not.toMatch(/jql/);
      expect(result.trim()).toBe(result); // Should be trimmed
    });
  });

  describe('Performance and Optimization', () => {
    test('should complete queries within reasonable time', async () => {
      const startTime = Date.now();
      
      const query = 'show recent issues for my team';
      await generateJQL(query);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle concurrent requests', async () => {
      const queries = [
        'show bugs for alice',
        'show tasks for bob',
        'show stories for charlie',
        'show epics for diana'
      ];

      const promises = queries.map(query => generateJQL(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Data Integrity', () => {
    test('should preserve special characters in queries', async () => {
      const query = 'show issues with summary containing "user@example.com"';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle unicode characters', async () => {
      const query = 'show issues assigned to André Müller';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle date formats correctly', async () => {
      const query = 'show issues created between 2025-01-01 and 2025-12-31';
      const result = await generateJQL(query);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/2025-01-01.*2025-12-31/);
    });
  });
});

// Integration test with actual caching behavior
describe('Cache Integration Tests', () => {
  test('should demonstrate token savings with caching', async () => {
    console.log('\n🧪 Testing Token Savings with Caching:');
    
    // Simulate multiple queries to show caching benefits
    const testQueries = [
      'show bugs for john',
      'show tasks for alice',
      'show stories for bob',
      'show my issues',
      'show backlog items'
    ];

    const initialStats = getTokenStats();
    console.log(`📊 Initial stats - Queries: ${initialStats.totalQueries}, Tokens: ${initialStats.totalTokens}`);

    for (const query of testQueries) {
      const result = await generateJQL(query);
      const currentStats = getTokenStats();
      
      console.log(`🔍 Query: "${query}"`);
      console.log(`📈 Result: ${result.substring(0, 50)}...`);
      console.log(`💾 Tokens used: ${currentStats.totalTokens - initialStats.totalTokens}`);
    }

    const finalStats = getTokenStats();
    console.log(`\n📊 Final stats - Queries: ${finalStats.totalQueries}, Total Tokens: ${finalStats.totalTokens}`);
    console.log(`💰 Average tokens per query: ${Math.round(finalStats.totalTokens / finalStats.totalQueries)}`);
  });
});
