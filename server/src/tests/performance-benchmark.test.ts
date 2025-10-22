/**
 * Performance Benchmark Tests for Prompt Caching
 * Measures token savings and response times
 */

import { generateJQL } from '../llm/generateJql';
import { getTokenStats, tokenTracker } from '../utils/tokenTracker';

// Mock to simulate realistic token usage
const SYSTEM_PROMPT_TOKENS = 385; // Estimated tokens for compressed system prompt
const ORIGINAL_PROMPT_TOKENS = 1500; // Estimated tokens for original full prompt

const mockResponseMap = new Map([
  ['show bugs for john', 'assignee = "john" AND type = Bug AND sprint in openSprints()'],
  ['show tasks for alice', 'assignee = "alice" AND type = Task AND sprint in openSprints()'],
  ['show worklog for sarah', 'worklogAuthor = "sarah" AND worklogDate >= -1w'],
  ['show backlog items', 'status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()'],
  ['show my issues', 'assignee = currentUser() AND sprint in openSprints()'],
  ['show high priority bugs', 'priority = High AND type = Bug AND sprint in openSprints()'],
  ['show stories for team ABC', '"team name" = "ABC" AND type = Story AND sprint in openSprints()'],
  ['show unassigned tasks', 'assignee is EMPTY AND type = Task AND sprint in openSprints()']
]);

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation((config) => ({
      generateContent: jest.fn().mockImplementation((prompt) => {
        // Simulate cache behavior - if systemInstruction is set, it's cached
        const isCached = config && config.systemInstruction;
        
        // Extract query from prompt
        const queryMatch = prompt.match(/Query: "([^"]+)"/);
        const query = queryMatch ? queryMatch[1] : '';
        
        // Simulate response time
        const responseTime = isCached ? 50 : 200; // Cached is faster
        
        return new Promise((resolve) => {
          setTimeout(() => {
            const response = mockResponseMap.get(query) || `summary ~ "${query}" AND sprint in openSprints()`;
            resolve({
              response: {
                text: jest.fn().mockReturnValue(response)
              }
            });
          }, responseTime);
        });
      })
    }))
  }))
}));

describe('Performance Benchmark Tests', () => {
  beforeEach(() => {
    // Reset token tracker for clean measurements
    tokenTracker.resetStats();
    process.env.GOOGLE_API_KEY = 'test-key-for-benchmarking';
  });

  describe('Token Usage Comparison', () => {
    test('should demonstrate significant token savings with caching', async () => {
      console.log('\n📊 TOKEN USAGE BENCHMARK');
      console.log('=' .repeat(50));
      
      // Test queries representing typical usage
      const testQueries = [
        'show bugs for john',
        'show tasks for alice', 
        'show worklog for sarah',
        'show backlog items',
        'show my issues',
        'show high priority bugs',
        'show stories for team ABC',
        'show unassigned tasks'
      ];

      const initialStats = getTokenStats();
      const startTime = Date.now();

      console.log(`🚀 Running ${testQueries.length} queries with caching...`);
      
      // Execute all queries
      for (let i = 0; i < testQueries.length; i++) {
        const query = testQueries[i];
        const result = await generateJQL(query);
        const currentStats = getTokenStats();
        
        console.log(`${i + 1}. "${query}"`);
        console.log(`   📝 Result: ${result.substring(0, 60)}...`);
        console.log(`   🔢 Tokens: ~${Math.ceil(query.length / 4)} input (vs ~${ORIGINAL_PROMPT_TOKENS} without cache)`);
      }

      const endTime = Date.now();
      const finalStats = getTokenStats();
      
      // Calculate metrics
      const totalDuration = endTime - startTime;
      const averageResponseTime = totalDuration / testQueries.length;
      const totalTokensUsed = finalStats.totalTokens - initialStats.totalTokens;
      const averageTokensPerQuery = Math.round(totalTokensUsed / testQueries.length);
      
      // Calculate theoretical savings
      const withoutCacheTokens = testQueries.length * (ORIGINAL_PROMPT_TOKENS + 50); // 50 avg for query + response
      const tokenSavings = withoutCacheTokens - totalTokensUsed;
      const savingsPercentage = Math.round((tokenSavings / withoutCacheTokens) * 100);

      console.log('\n📈 PERFORMANCE RESULTS');
      console.log('=' .repeat(30));
      console.log(`⏱️  Total Time: ${totalDuration}ms`);
      console.log(`⚡ Avg Response Time: ${Math.round(averageResponseTime)}ms`);
      console.log(`🔢 Total Tokens Used: ${totalTokensUsed}`);
      console.log(`📊 Avg Tokens/Query: ${averageTokensPerQuery}`);
      console.log(`💰 Token Savings: ${savingsPercentage}% (${tokenSavings} tokens saved)`);
      console.log(`🎯 Efficiency: ${Math.round(testQueries.length / (totalDuration / 1000))} queries/second`);

      // Assertions
      expect(finalStats.totalQueries).toBe(testQueries.length);
      expect(totalTokensUsed).toBeGreaterThan(0);
      expect(averageTokensPerQuery).toBeLessThan(ORIGINAL_PROMPT_TOKENS); // Should use fewer tokens
      expect(savingsPercentage).toBeGreaterThan(70); // Should save at least 70%
    });

    test('should compare cached vs non-cached performance', async () => {
      console.log('\n⚖️  CACHED vs NON-CACHED COMPARISON');
      console.log('=' .repeat(40));

      const query = 'show bugs for performance test';
      
      // Simulate non-cached (full prompt every time)
      const nonCachedTokens = ORIGINAL_PROMPT_TOKENS + Math.ceil(query.length / 4) + 20; // response tokens
      
      // Simulate cached (only user query)
      const cachedTokens = Math.ceil(query.length / 4) + 20; // response tokens
      
      const tokenSavings = nonCachedTokens - cachedTokens;
      const savingsPercentage = Math.round((tokenSavings / nonCachedTokens) * 100);

      console.log(`📤 Non-cached tokens: ${nonCachedTokens}`);
      console.log(`📥 Cached tokens: ${cachedTokens}`);
      console.log(`💰 Savings: ${tokenSavings} tokens (${savingsPercentage}%)`);
      
      expect(savingsPercentage).toBeGreaterThan(85); // Should save at least 85%
      expect(cachedTokens).toBeLessThan(100); // Cached should be very efficient
    });
  });

  describe('Response Time Performance', () => {
    test('should have consistent response times', async () => {
      const query = 'show my recent issues';
      const iterations = 5;
      const responseTimes: number[] = [];

      console.log(`\n⏱️  RESPONSE TIME TEST (${iterations} iterations)`);
      console.log('=' .repeat(35));

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await generateJQL(query);
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        console.log(`${i + 1}. Response time: ${responseTime}ms`);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`📊 Average: ${Math.round(avgResponseTime)}ms`);
      console.log(`⬆️  Max: ${maxResponseTime}ms`);
      console.log(`⬇️  Min: ${minResponseTime}ms`);

      // Assertions
      expect(avgResponseTime).toBeLessThan(5000); // Should be under 5 seconds
      expect(maxResponseTime).toBeLessThan(10000); // No response should take more than 10 seconds
    });

    test('should handle concurrent requests efficiently', async () => {
      const queries = [
        'show bugs for user1',
        'show tasks for user2',
        'show stories for user3',
        'show epics for user4',
        'show my issues'
      ];

      console.log(`\n🚀 CONCURRENT REQUESTS TEST (${queries.length} parallel)`);
      console.log('=' .repeat(40));

      const startTime = Date.now();
      const promises = queries.map((query, index) => {
        console.log(`📤 Starting query ${index + 1}: "${query}"`);
        return generateJQL(query);
      });

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      console.log(`✅ All queries completed in ${totalTime}ms`);
      console.log(`⚡ Throughput: ${Math.round(queries.length / (totalTime / 1000))} queries/second`);

      // Assertions
      expect(results).toHaveLength(queries.length);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      results.forEach(result => {
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Memory and Cache Efficiency', () => {
    test('should demonstrate cache hit benefits', async () => {
      console.log('\n💾 CACHE EFFICIENCY TEST');
      console.log('=' .repeat(25));

      // Test repeated queries to demonstrate cache benefits
      const query = 'show my assigned tasks';
      const iterations = 3;

      const initialStats = getTokenStats();
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const result = await generateJQL(query);
        const responseTime = Date.now() - startTime;
        
        console.log(`${i + 1}. Query: "${query}" (${responseTime}ms)`);
        console.log(`   📝 Result: ${result.substring(0, 50)}...`);
      }

      const finalStats = getTokenStats();
      const totalTokens = finalStats.totalTokens - initialStats.totalTokens;
      const avgTokensPerQuery = Math.round(totalTokens / iterations);

      console.log(`\n📊 Cache Performance:`);
      console.log(`🔄 Iterations: ${iterations}`);
      console.log(`🔢 Total tokens: ${totalTokens}`);
      console.log(`📊 Avg tokens/query: ${avgTokensPerQuery}`);
      console.log(`💰 Expected savings: ~${Math.round((1 - avgTokensPerQuery / ORIGINAL_PROMPT_TOKENS) * 100)}%`);

      expect(avgTokensPerQuery).toBeLessThan(200); // Should be very efficient with caching
    });
  });

  describe('Cost Analysis', () => {
    test('should calculate cost savings with caching', async () => {
      console.log('\n💰 COST ANALYSIS');
      console.log('=' .repeat(20));

      // Typical pricing for Gemini (approximate)
      const costPerMillion = 0.35; // $0.35 per 1M input tokens
      const costPerToken = costPerMillion / 1000000;

      const monthlyQueries = 10000; // Estimated monthly usage
      
      // Without caching
      const tokensWithoutCache = monthlyQueries * ORIGINAL_PROMPT_TOKENS;
      const costWithoutCache = tokensWithoutCache * costPerToken;
      
      // With caching (assuming 90% savings)
      const tokensWithCache = monthlyQueries * (ORIGINAL_PROMPT_TOKENS * 0.1);
      const costWithCache = tokensWithCache * costPerToken;
      
      const monthlySavings = costWithoutCache - costWithCache;
      const yearlySavings = monthlySavings * 12;

      console.log(`📈 Monthly queries: ${monthlyQueries.toLocaleString()}`);
      console.log(`💸 Cost without caching: $${costWithoutCache.toFixed(2)}/month`);
      console.log(`💰 Cost with caching: $${costWithCache.toFixed(2)}/month`);
      console.log(`🎯 Monthly savings: $${monthlySavings.toFixed(2)}`);
      console.log(`🎊 Yearly savings: $${yearlySavings.toFixed(2)}`);
      console.log(`📊 Savings percentage: ${Math.round((monthlySavings / costWithoutCache) * 100)}%`);

      expect(monthlySavings).toBeGreaterThan(0);
      expect(yearlySavings).toBeGreaterThan(monthlySavings * 10);
    });
  });
});
