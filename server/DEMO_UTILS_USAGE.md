# Demo Utils Usage Guide

This document explains how to use the demo utilities for filtering JIRA backlog data based on **JQL (JIRA Query Language)** queries.

## Functions

### `getDemoBacklogData(jsonData, jqlQuery)`
Main filtering function that processes JSON data and returns filtered issues based on JQL query patterns.

### `getFilteredBacklogData(jsonData, jqlQuery)`
Helper function that returns data in the same format as the JIRA API response.

### `getDemoBacklogDataWithUser(jsonData, jqlQuery, currentUserDisplayName)`
Enhanced version that supports `currentUser()` JQL function by providing current user context.

## Supported JQL Queries

1. **Unassigned issues from backlog**
   ```jql
   assignee IS EMPTY
   ```

2. **Unassigned issues for a specific sprint**
   ```jql
   assignee IS EMPTY AND sprint = "ABC"
   ```

3. **My issues (current user)**
   ```jql
   assignee = currentUser()
   ```

4. **Specific user's issues**
   ```jql
   assignee = "Kabita Sharma"
   ```

5. **P0 priority issues**
   ```jql
   priority = P0
   ```

6. **Specific user's issues in a specific sprint**
   ```jql
   assignee = "Kabita Sharma" AND sprint = "ABC"
   ```

## Usage Examples

### In jiraService.ts

```typescript
import { getFilteredBacklogData, getDemoBacklogDataWithUser } from '../utils/demoUtils';
import * as fs from 'fs';
import * as path from 'path';

// In your fetchJiraIssues function, when isDemo is true and forType is 'backlog'
if (isDemo && forType === 'backlog') {
  const filePath = path.join(__dirname, '../../../../jiraBacklogSampleData.json');
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Use JQL query to filter data
  const jqlQuery = "assignee IS EMPTY"; // or any other JQL query
  
  // Use the filtering function
  const filteredData = getFilteredBacklogData(jsonData, jqlQuery);
  
  response = {
    data: filteredData,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  } as AxiosResponse<any, any>;
}
```

### With Current User Context

```typescript
// For currentUser() JQL function
const currentUser = "Douglas Almena"; // Get from authentication context
const jqlQuery = "assignee = currentUser()";

const filteredIssues = getDemoBacklogDataWithUser(jsonData, jqlQuery, currentUser);
```

## JQL Pattern Matching

The implementation uses regex patterns to parse JQL syntax:

- **Assignee queries**: 
  - `assignee IS EMPTY` or `assignee = EMPTY` → unassigned issues
  - `assignee = currentUser()` → current user's issues
  - `assignee = "User Name"` → specific user's issues
- **Priority queries**: `priority = P0` → matches priority field
- **Sprint queries**: `sprint = "Sprint Name"` → matches sprint field
- **Complex queries**: Uses `AND` to combine multiple conditions

## Integration with AI Services

You can integrate this with your AI assistant by:

1. Converting natural language queries to JQL
2. Using the JQL filtering functions
3. Returning the filtered results

```typescript
// In your AI service
if (userQuery.includes('from backlog') && isDemo) {
  const backlogData = JSON.parse(fs.readFileSync(backlogDataPath, 'utf8'));
  
  // Convert natural language to JQL (or receive JQL directly)
  const jqlQuery = convertToJql(userQuery); // e.g., "assignee IS EMPTY"
  
  const results = getFilteredBacklogData(backlogData, jqlQuery);
  
  return {
    message: `Found ${results.total} matching issues`,
    data: results
  };
}
```

## Test Results

All JQL query types have been tested with the sample data:

- ✅ `assignee IS EMPTY`: 2 unassigned issues found
- ✅ `assignee = "User Name"`: Works with real user names (Douglas Almena, John Smith, etc.)
- ✅ `priority = P0`: 4 P0 issues found  
- ✅ `sprint = "25.3.5"`: Works with actual sprint names
- ✅ `assignee = currentUser()`: Successfully matches current user's issues
- ✅ Complex AND queries: Successfully combines multiple conditions

## Data Structure Requirements

The implementation expects JIRA issues with the following structure:

```typescript
{
  fields: {
    assignee: {
      displayName: string;
    } | null;
    priority: {
      name: string; // e.g., "P0", "P1", "P2"
    };
    customfield_10020: [{
      name: string; // Sprint name
    }];
  }
}
```
