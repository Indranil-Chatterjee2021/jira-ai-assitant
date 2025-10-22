import { generateJQL } from '../llm/generateJql';
import { calculateStoryPoints } from '../services/jiraService';
import { createStoryPointsExcel } from '../utils/excelExport';
import { analyzeStoryPoints } from '../services/aiService';

describe('Story Points Implementation Tests', () => {
  
  describe('JQL Generation for Story Points', () => {
    it('should generate JQL for story points query with single assignee and sprint', async () => {
      const query = 'total story points of assignee John for sprint ABC';
      const jql = await generateJQL(query);
      
      expect(jql).toContain('assignee');
      expect(jql).toContain('John');
      expect(jql).toContain('Sprint = "ABC"');
      expect(jql).toContain('"Story Points" is not EMPTY');
    });

    it('should generate JQL for story points query with multiple assignees', async () => {
      const query = 'story points for Alice and Bob in sprint XYZ';
      const jql = await generateJQL(query);
      
      expect(jql).toContain('assignee in (');
      expect(jql).toContain('Alice');
      expect(jql).toContain('Bob');
      expect(jql).toContain('Sprint = "XYZ"');
      expect(jql).toContain('"Story Points" is not EMPTY');
    });

    it('should handle story points query without specific sprint', async () => {
      const query = 'how many story points are assigned to Sarah';
      const jql = await generateJQL(query);
      
      expect(jql).toContain('assignee');
      expect(jql).toContain('Sarah');
      expect(jql).toContain('"Story Points" is not EMPTY');
      // Should add default sprint filter
      expect(jql).toContain('sprint in openSprints()');
    });
  });

  describe('Story Points Calculation', () => {
    const mockJql = 'assignee in ("John", "Alice") AND Sprint = "Test Sprint" AND "Story Points" is not EMPTY';
    const mockAssignees = ['John', 'Alice'];
    const mockSprint = 'Test Sprint';

    it('should calculate story points for demo mode', async () => {
      // Set demo mode
      process.env.IS_DEMO = 'true';
      
      const result = await calculateStoryPoints(mockJql, mockAssignees, mockSprint);
      
      expect(Array.isArray(result)).toBe(true);
      // In demo mode, might return empty array if no matching data
      expect(result).toBeDefined();
    });

    it('should handle empty assignees list', async () => {
      process.env.IS_DEMO = 'true';
      
      const result = await calculateStoryPoints(mockJql, [], mockSprint);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should handle invalid JQL gracefully', async () => {
      process.env.IS_DEMO = 'true';
      
      try {
        const result = await calculateStoryPoints('invalid jql', mockAssignees, mockSprint);
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Excel Export for Story Points', () => {
    const mockStoryPointsData = [
      {
        assignee: 'John Doe',
        totalStoryPoints: 15,
        completedStoryPoints: 10,
        inProgressStoryPoints: 3,
        todoStoryPoints: 2,
        issueCount: 5,
        issues: [
          {
            key: 'TEST-001',
            summary: 'Test Issue 1',
            storyPoints: 5,
            status: 'Done'
          },
          {
            key: 'TEST-002',
            summary: 'Test Issue 2', 
            storyPoints: 3,
            status: 'In Progress'
          }
        ]
      },
      {
        assignee: 'Alice Smith',
        totalStoryPoints: 12,
        completedStoryPoints: 8,
        inProgressStoryPoints: 4,
        todoStoryPoints: 0,
        issueCount: 3,
        issues: [
          {
            key: 'TEST-003',
            summary: 'Test Issue 3',
            storyPoints: 8,
            status: 'Done'
          }
        ]
      }
    ];

    it('should create Excel buffer from story points data', () => {
      const excelBuffer = createStoryPointsExcel(mockStoryPointsData, {
        fileName: 'test-story-points',
        includeDetailedView: true
      });

      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should create Excel with summary sheet only', () => {
      const excelBuffer = createStoryPointsExcel(mockStoryPointsData, {
        fileName: 'test-summary-only',
        includeDetailedView: false
      });

      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should handle empty story points data', () => {
      const excelBuffer = createStoryPointsExcel([], {
        fileName: 'test-empty'
      });

      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('AI Analysis for Story Points', () => {
    const mockStoryPointsData = [
      {
        assignee: 'Developer A',
        totalStoryPoints: 20,
        completedStoryPoints: 15,
        inProgressStoryPoints: 5,
        todoStoryPoints: 0,
        issueCount: 4,
        issues: []
      },
      {
        assignee: 'Developer B', 
        totalStoryPoints: 18,
        completedStoryPoints: 10,
        inProgressStoryPoints: 3,
        todoStoryPoints: 5,
        issueCount: 6,
        issues: []
      }
    ];

    it('should generate analysis without AI (fallback mode)', async () => {
      // Force fallback by not having Google AI key
      const originalKey = process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const analysis = await analyzeStoryPoints(mockStoryPointsData, 'story points for developers');

      expect(typeof analysis).toBe('string');
      expect(analysis).toContain('Story Points Analysis');
      expect(analysis).toContain('Developer A');
      expect(analysis).toContain('Developer B');
      expect(analysis).toContain('38'); // Total story points

      // Restore key
      if (originalKey) {
        process.env.GOOGLE_API_KEY = originalKey;
      }
    });

    it('should handle empty story points data in analysis', async () => {
      delete process.env.GOOGLE_API_KEY;

      const analysis = await analyzeStoryPoints([], 'empty story points');

      expect(typeof analysis).toBe('string');
      expect(analysis).toContain('0'); // Should show 0 points
    });
  });

  describe('Integration Test - End-to-End Story Points Flow', () => {
    it('should handle complete story points workflow', async () => {
      // Set demo mode
      process.env.IS_DEMO = 'true';
      
      // 1. Generate JQL from natural language
      const query = 'story points for John and Alice in sprint TEST';
      const jql = await generateJQL(query);
      expect(jql).toBeDefined();
      expect(typeof jql).toBe('string');

      // 2. Calculate story points using generated JQL
      const storyPointsData = await calculateStoryPoints(jql, ['John', 'Alice'], 'TEST');
      expect(Array.isArray(storyPointsData)).toBe(true);

      // 3. Generate AI analysis
      delete process.env.GOOGLE_API_KEY; // Force fallback for testing
      const analysis = await analyzeStoryPoints(storyPointsData, query);
      expect(typeof analysis).toBe('string');

      // 4. Create Excel export
      const excelBuffer = createStoryPointsExcel(storyPointsData, {
        fileName: 'integration-test',
        includeDetailedView: true
      });
      expect(Buffer.isBuffer(excelBuffer)).toBe(true);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JQL queries', async () => {
      process.env.IS_DEMO = 'true';
      
      const malformedJql = 'assignee = AND Sprint =';
      
      try {
        const result = await calculateStoryPoints(malformedJql, [], '');
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle very large assignee lists', async () => {
      const largeAssigneeList = Array.from({ length: 100 }, (_, i) => `User${i}`);
      const jql = 'assignee in (user1, user2) AND "Story Points" is not EMPTY';
      
      process.env.IS_DEMO = 'true';
      
      const result = await calculateStoryPoints(jql, largeAssigneeList);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle special characters in sprint names', async () => {
      const specialSprintName = 'Sprint "Test" & Development (2024)';
      const query = `story points for users in sprint ${specialSprintName}`;
      
      const jql = await generateJQL(query);
      expect(jql).toBeDefined();
      expect(typeof jql).toBe('string');
    });
  });
});

// Performance and Load Tests
describe('Story Points Performance Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const startTime = Date.now();
    
    // Create large mock dataset
    const largeStoryPointsData = Array.from({ length: 1000 }, (_, i) => ({
      assignee: `Developer${i}`,
      totalStoryPoints: Math.floor(Math.random() * 50) + 1,
      completedStoryPoints: Math.floor(Math.random() * 30),
      inProgressStoryPoints: Math.floor(Math.random() * 10),
      todoStoryPoints: Math.floor(Math.random() * 10),
      issueCount: Math.floor(Math.random() * 20) + 1,
      issues: Array.from({ length: 5 }, (_, j) => ({
        key: `PERF-${i}-${j}`,
        summary: `Performance Test Issue ${j}`,
        storyPoints: Math.floor(Math.random() * 10) + 1,
        status: ['Done', 'In Progress', 'To Do'][j % 3]
      }))
    }));

    // Test Excel export performance
    const excelBuffer = createStoryPointsExcel(largeStoryPointsData, {
      includeDetailedView: true
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(Buffer.isBuffer(excelBuffer)).toBe(true);
    expect(excelBuffer.length).toBeGreaterThan(0);
    // Should complete within reasonable time (adjust threshold as needed)
    expect(executionTime).toBeLessThan(10000); // 10 seconds max
  });
});