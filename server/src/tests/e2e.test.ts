/**
 * Comprehensive End-to-End Test Cases for JIRA AI Assistant
 * Tests the complete flow without mocking using different data sources
 */

import request from 'supertest';
import { app } from '../index';

jest.setTimeout(600000000);

describe('JIRA AI Assistant E2E Tests', () => {
  // Test server health
  describe('Health Check', () => {
    test('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('connections');
      expect(response.body.connections).toHaveProperty('jira');
      expect(response.body.connections).toHaveProperty('ai');
    });
  });

  // Test token statistics
  describe('Token Statistics', () => {
    test('should return token usage statistics', async () => {
      const response = await request(app)
        .get('/stats/tokens')
        .expect(200);

      expect(response.body).toHaveProperty('totalQueries');
      expect(response.body).toHaveProperty('totalInputTokens');
      expect(response.body).toHaveProperty('totalOutputTokens');
      expect(response.body).toHaveProperty('totalTokens');
      expect(typeof response.body.totalQueries).toBe('number');
      expect(typeof response.body.totalTokens).toBe('number');
    });
  });

  // =======================
  // WORKLOG RELATED QUERIES (jiraWorklogData.json)
  // =======================
  describe('Worklog Related Queries', () => {
    test('WL-1: should process worklog summary query for specific user', async () => {
      const query = 'show me worklog summary for Sarah Jones for the period of 2025-08-01 to 2025-08-03';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      expect(response.body).toHaveProperty('worklogSummary');
      
      if (response.body.worklogSummary && response.body.worklogSummary.length > 0) {
        expect(response.body.worklogSummary[0]).toHaveProperty('user');
        expect(response.body.worklogSummary[0]).toHaveProperty('totalHours');
        expect(response.body.worklogSummary[0]).toHaveProperty('entries');
        expect(Array.isArray(response.body.worklogSummary[0].entries)).toBe(true);
      }
    });

    test('WL-2: should process worklog hours comparison between multiple users', async () => {
      const query = 'compare worklog hours between Rajagopal Govindaraj and John Smith in August 2025';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      expect(response.body).toHaveProperty('worklogSummary');
      
      if (response.body.worklogSummary) {
        expect(Array.isArray(response.body.worklogSummary)).toBe(true);
        // Should contain entries for multiple users if data exists
        response.body.worklogSummary.forEach((entry: any) => {
          expect(entry).toHaveProperty('user');
          expect(entry).toHaveProperty('totalHours');
          expect(typeof entry.totalHours).toBe('number');
        });
      }
    });

    test('WL-3: should process time tracking query for specific issue', async () => {
      const query = 'show time spent on issue TEST-142319 with worklog details';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      
      if (response.body.issues && response.body.issues.length > 0) {
        const issue = response.body.issues[0];
        if (issue.fields && issue.fields.worklog) {
          expect(issue.fields.worklog).toHaveProperty('worklogs');
          expect(Array.isArray(issue.fields.worklog.worklogs)).toBe(true);
        }
      }
    });

    test('WL-4: should process daily worklog breakdown query', async () => {
      const query = 'show daily worklog breakdown for all users from August 1st to August 10th, 2025';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      expect(response.body).toHaveProperty('worklogSummary');
      
      if (response.body.worklogSummary) {
        expect(Array.isArray(response.body.worklogSummary)).toBe(true);
        response.body.worklogSummary.forEach((entry: any) => {
          expect(entry).toHaveProperty('user');
          expect(entry).toHaveProperty('totalHours');
          if (entry.entries && entry.entries.length > 0) {
            expect(entry.entries[0]).toHaveProperty('timeSpentSeconds');
            expect(entry.entries[0]).toHaveProperty('started');
          }
        });
      }
    });

    test('WL-5: should process worklog query by time zone analysis', async () => {
      const query = 'analyze worklog entries by time zones and show distribution of work hours';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      expect(response.body).toHaveProperty('worklogSummary');
      
      if (response.body.worklogSummary) {
        expect(Array.isArray(response.body.worklogSummary)).toBe(true);
        response.body.worklogSummary.forEach((entry: any) => {
          expect(entry).toHaveProperty('user');
          if (entry.entries && entry.entries.length > 0) {
            expect(entry.entries[0]).toHaveProperty('author');
            if (entry.entries[0].author) {
              expect(entry.entries[0].author).toHaveProperty('timeZone');
            }
          }
        });
      }
    });

    test('WL-6: should process team worklog efficiency query', async () => {
      const query = 'show team worklog efficiency metrics including average hours per day and total project time for issues with multiple worklogs';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', true);
      expect(response.body).toHaveProperty('worklogSummary');
      
      if (response.body.worklogSummary) {
        expect(Array.isArray(response.body.worklogSummary)).toBe(true);
        response.body.worklogSummary.forEach((entry: any) => {
          expect(entry).toHaveProperty('user');
          expect(entry).toHaveProperty('totalHours');
          expect(typeof entry.totalHours).toBe('number');
        });
      }
    });
  });

  // =======================
  // BACKLOG RELATED QUERIES (jiraBacklogSampleData.json)
  // =======================
  describe('Backlog Related Queries', () => {
    test.only('BL-1: should process epic-level backlog planning query', async () => {
      const query = 'show the backlog issues of Alex Taylor';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', false);
      
      if (response.body.issues && response.body.issues.length > 0) {
        const issue = response.body.issues[0];
        expect(issue).toHaveProperty('fields');
        if (issue.fields.parent) {
          expect(issue.fields.parent).toHaveProperty('key');
          expect(issue.fields.parent).toHaveProperty('fields');
        }
      }
    });

    test('BL-2: should process sprint capacity planning query', async () => {
      const query = 'show all tasks assigned to TEST TEAM for sprint 25.3.5 with story points and time estimates';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          if (issue.fields.customfield_10020) {
            expect(Array.isArray(issue.fields.customfield_10020)).toBe(true);
          }
          if (issue.fields.customfield_10036) {
            expect(typeof issue.fields.customfield_10036).toBe('number');
          }
        });
      }
    });

    test('BL-3: should process prioritization and dependency analysis', async () => {
      const query = 'analyze priority distribution and dependencies for authentication module backlog items';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('priority');
          if (issue.fields.priority) {
            expect(issue.fields.priority).toHaveProperty('name');
          }
          if (issue.fields.issuelinks) {
            expect(Array.isArray(issue.fields.issuelinks)).toBe(true);
          }
        });
      }
    });

    test('BL-4: should process team assignment and workload distribution query', async () => {
      const query = 'show workload distribution across team members for upcoming sprint with unassigned items';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          // Check assignee field - can be null for unassigned items
          if (issue.fields.assignee) {
            expect(issue.fields.assignee).toHaveProperty('displayName');
          }
          if (issue.fields.customfield_10001) {
            expect(issue.fields.customfield_10001).toHaveProperty('name');
          }
        });
      }
    });

    test('BL-5: should process backlog refinement and estimation query', async () => {
      const query = 'show items without story points or time estimates that need refinement in the backlog';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('summary');
          // Check estimation fields
          if (issue.fields.timeestimate !== undefined) {
            expect(typeof issue.fields.timeestimate).toBe('number');
          }
          if (issue.fields.customfield_10036 !== undefined) {
            expect(typeof issue.fields.customfield_10036).toBe('number');
          }
        });
      }
    });

    test('BL-6: should process release planning and version tracking query', async () => {
      const query = 'show backlog items by fix version and release readiness status for upcoming releases';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('status');
          if (issue.fields.fixVersions) {
            expect(Array.isArray(issue.fields.fixVersions)).toBe(true);
          }
          if (issue.fields.status) {
            expect(issue.fields.status).toHaveProperty('name');
            expect(issue.fields.status).toHaveProperty('statusCategory');
          }
        });
      }
    });
  });

  // =======================
  // GENERAL QUERIES (jiraIssues_processed.json)
  // =======================
  describe('General Issue Queries', () => {
    test('GQ-1: should process comprehensive issue search with filters', async () => {
      const query = 'show all high priority issues in MSC project assigned to active users with recent activity';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', false);
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('priority');
          expect(issue.fields).toHaveProperty('project');
          if (issue.fields.assignee) {
            expect(issue.fields.assignee).toHaveProperty('active');
          }
        });
      }
    });

    test('GQ-2: should process status transition and workflow analysis', async () => {
      const query = 'analyze issues by status transitions and show workflow bottlenecks for Media Supply Chain project';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('status');
          expect(issue.fields.status).toHaveProperty('statusCategory');
          expect(issue.fields).toHaveProperty('updated');
          if (issue.fields.statuscategorychangedate) {
            expect(typeof issue.fields.statuscategorychangedate).toBe('string');
          }
        });
      }
    });

    test('GQ-3: should process component and label-based categorization', async () => {
      const query = 'show issues grouped by components and labels for better categorization and reporting';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          if (issue.fields.components) {
            expect(Array.isArray(issue.fields.components)).toBe(true);
          }
          if (issue.fields.labels) {
            expect(Array.isArray(issue.fields.labels)).toBe(true);
          }
          if (issue.fields.customfield_10172) {
            expect(Array.isArray(issue.fields.customfield_10172)).toBe(true);
          }
        });
      }
    });

    test('GQ-4: should process custom field analysis and reporting', async () => {
      const query = 'analyze custom field usage including team assignments, story points, and sprint data for reporting dashboard';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          // Check various custom fields
          if (issue.fields.customfield_10001) {
            expect(issue.fields.customfield_10001).toHaveProperty('name');
          }
          if (issue.fields.customfield_10020) {
            expect(Array.isArray(issue.fields.customfield_10020)).toBe(true);
          }
          if (issue.fields.customfield_10036 !== undefined) {
            expect(typeof issue.fields.customfield_10036).toBe('number');
          }
        });
      }
    });

    test('GQ-5: should process temporal analysis and trend identification', async () => {
      const query = 'show temporal trends in issue creation, resolution, and update patterns over the last quarter';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          expect(issue.fields).toHaveProperty('created');
          expect(issue.fields).toHaveProperty('updated');
          if (issue.fields.resolutiondate) {
            expect(typeof issue.fields.resolutiondate).toBe('string');
          }
          if (issue.fields.resolution) {
            expect(issue.fields.resolution).toHaveProperty('name');
          }
        });
      }
    });

    test('GQ-6: should process cross-project dependency and relationship analysis', async () => {
      const query = 'analyze cross-project dependencies and issue relationships including parent-child hierarchies and linked issues';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      
      if (response.body.issues && response.body.issues.length > 0) {
        response.body.issues.forEach((issue: any) => {
          expect(issue).toHaveProperty('fields');
          if (issue.fields.parent) {
            expect(issue.fields.parent).toHaveProperty('key');
            expect(issue.fields.parent).toHaveProperty('fields');
          }
          if (issue.fields.issuelinks) {
            expect(Array.isArray(issue.fields.issuelinks)).toBe(true);
            if (issue.fields.issuelinks.length > 0) {
              expect(issue.fields.issuelinks[0]).toHaveProperty('type');
            }
          }
          if (issue.fields.subtasks) {
            expect(Array.isArray(issue.fields.subtasks)).toBe(true);
          }
        });
      }
    });
  });

  // =======================
  // EXISTING TESTS (Updated)
  // =======================
  describe('Core System Tests', () => {
    test('should process basic query workflow', async () => {
      const query = 'show recent issues';
      
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('query', query);
      expect(response.body.metadata).toHaveProperty('isWorklogQuery', false);
      expect(Array.isArray(response.body.issues)).toBe(true);
    });

    test('should handle invalid query gracefully', async () => {
      const response = await request(app)
        .post('/query')
        .send({ query: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing query parameter', async () => {
      const response = await request(app)
        .post('/query')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  // Test JQL generation flow
  describe('JQL Generation', () => {
    test('should generate different JQL for different query types', async () => {
      const queries = [
        'show bugs assigned to john',
        'show high priority issues',
        'show issues created last week'
      ];

      for (const query of queries) {
        const response = await request(app)
          .post('/query')
          .send({ query })
          .expect(200);

        expect(response.body.jql).toBeTruthy();
        expect(typeof response.body.jql).toBe('string');
        expect(response.body.jql.length).toBeGreaterThan(0);
      }
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/query')
        .type('json')
        .send('{ invalid json }')
        .expect(400);
    });

    test('should handle non-existent endpoints', async () => {
      await request(app)
        .get('/non-existent-endpoint')
        .expect(404);
    });
  });

  // Test CORS and security headers
  describe('Security', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers added by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  // Performance tests
  describe('Performance', () => {
    test('should respond to health check within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });
    });
  });

  // Integration tests
  describe('Full Integration', () => {
    test('should complete a full query workflow', async () => {
      // 1. Check health
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      
      expect(healthResponse.body.status).toBe('OK');

      // 2. Get initial token stats
      const initialStatsResponse = await request(app)
        .get('/stats/tokens')
        .expect(200);
      
      const initialQueries = initialStatsResponse.body.totalQueries;

      // 3. Execute a query
      const queryResponse = await request(app)
        .post('/query')
        .send({ query: 'show recent issues' })
        .expect(200);
      
      expect(queryResponse.body).toHaveProperty('jql');
      expect(queryResponse.body).toHaveProperty('issues');

      // 4. Verify token stats updated
      const finalStatsResponse = await request(app)
        .get('/stats/tokens')
        .expect(200);
      
      expect(finalStatsResponse.body.totalQueries).toBeGreaterThanOrEqual(initialQueries);
    });
  });
});

// Helper functions for test data validation
const validateIssueStructure = (issue: any) => {
  expect(issue).toHaveProperty('id');
  expect(issue).toHaveProperty('key');
  expect(issue).toHaveProperty('fields');
  expect(issue.fields).toHaveProperty('summary');
  
  if (issue.fields.assignee) {
    expect(issue.fields.assignee).toHaveProperty('displayName');
  }
  
  if (issue.fields.status) {
    expect(issue.fields.status).toHaveProperty('name');
  }
  
  if (issue.fields.priority) {
    expect(issue.fields.priority).toHaveProperty('name');
  }
};

const validateWorklogStructure = (worklogEntry: any) => {
  expect(worklogEntry).toHaveProperty('user');
  expect(worklogEntry).toHaveProperty('totalHours');
  expect(typeof worklogEntry.totalHours).toBe('number');
  
  if (worklogEntry.entries && worklogEntry.entries.length > 0) {
    expect(Array.isArray(worklogEntry.entries)).toBe(true);
    expect(worklogEntry.entries[0]).toHaveProperty('timeSpentSeconds');
    expect(worklogEntry.entries[0]).toHaveProperty('started');
    expect(worklogEntry.entries[0]).toHaveProperty('author');
  }
};

const validateBacklogIssue = (issue: any) => {
  validateIssueStructure(issue);
  
  // Additional validations specific to backlog items
  if (issue.fields.customfield_10020) {
    expect(Array.isArray(issue.fields.customfield_10020)).toBe(true);
    if (issue.fields.customfield_10020.length > 0) {
      expect(issue.fields.customfield_10020[0]).toHaveProperty('name');
      expect(issue.fields.customfield_10020[0]).toHaveProperty('state');
    }
  }
  
  if (issue.fields.customfield_10001) {
    expect(issue.fields.customfield_10001).toHaveProperty('name');
  }
};

const validateProcessedIssue = (issue: any) => {
  validateIssueStructure(issue);
  
  // Additional validations for processed issues
  expect(issue.fields).toHaveProperty('project');
  expect(issue.fields.project).toHaveProperty('key');
  
  if (issue.fields.parent) {
    expect(issue.fields.parent).toHaveProperty('key');
    expect(issue.fields.parent).toHaveProperty('fields');
  }
  
  if (issue.fields.customfield_10172) {
    expect(Array.isArray(issue.fields.customfield_10172)).toBe(true);
  }
};

// Comprehensive data validation tests
describe('Data Structure Validation', () => {
  test('should return properly structured worklog data', async () => {
    const response = await request(app)
      .post('/query')
      .send({ query: 'show worklog summary for last week' })
      .expect(200);

    if (response.body.worklogSummary && response.body.worklogSummary.length > 0) {
      validateWorklogStructure(response.body.worklogSummary[0]);
    }
  });

  test('should return properly structured backlog issue data', async () => {
    const response = await request(app)
      .post('/query')
      .send({ query: 'show backlog items for current sprint' })
      .expect(200);

    if (response.body.issues && response.body.issues.length > 0) {
      validateBacklogIssue(response.body.issues[0]);
    }
  });

  test('should return properly structured general issue data', async () => {
    const response = await request(app)
      .post('/query')
      .send({ query: 'show recent issues in MSC project' })
      .expect(200);

    if (response.body.issues && response.body.issues.length > 0) {
      validateProcessedIssue(response.body.issues[0]);
    }
  });

  test('should validate response metadata structure', async () => {
    const response = await request(app)
      .post('/query')
      .send({ query: 'show issues' })
      .expect(200);

    expect(response.body).toHaveProperty('metadata');
    expect(response.body.metadata).toHaveProperty('query');
    expect(response.body.metadata).toHaveProperty('isWorklogQuery');
    expect(typeof response.body.metadata.isWorklogQuery).toBe('boolean');
    
    if (response.body.metadata.processingTime) {
      expect(typeof response.body.metadata.processingTime).toBe('number');
    }
  });

  test('should validate JQL query generation', async () => {
    const testQueries = [
      'show bugs',
      'show worklog for user',
      'show backlog items',
      'show high priority issues'
    ];

    for (const query of testQueries) {
      const response = await request(app)
        .post('/query')
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('jql');
      expect(typeof response.body.jql).toBe('string');
      expect(response.body.jql.length).toBeGreaterThan(0);
      expect(response.body.jql).not.toContain('undefined');
      expect(response.body.jql).not.toContain('null');
    }
  });

  test('should validate complex query response structure', async () => {
    const complexQuery = 'show issues with worklogs and parent-child relationships for Media Supply Chain project';
    
    const response = await request(app)
      .post('/query')
      .send({ query: complexQuery })
      .expect(200);

    expect(response.body).toHaveProperty('jql');
    expect(response.body).toHaveProperty('issues');
    expect(response.body).toHaveProperty('metadata');
    
    if (response.body.issues && response.body.issues.length > 0) {
      const issue = response.body.issues[0];
      validateProcessedIssue(issue);
      
      // Additional complex validations
      if (issue.fields.issuelinks) {
        expect(Array.isArray(issue.fields.issuelinks)).toBe(true);
      }
      
      if (issue.fields.worklog) {
        expect(issue.fields.worklog).toHaveProperty('total');
        if (issue.fields.worklog.worklogs) {
          expect(Array.isArray(issue.fields.worklog.worklogs)).toBe(true);
        }
      }
    }
  });
});