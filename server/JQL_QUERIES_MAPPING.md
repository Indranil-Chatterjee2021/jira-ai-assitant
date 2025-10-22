# JQL Queries Mapping

This document maps your 6 plain text requirements to their corresponding JQL queries that work with the implemented demo utilities.

## Query Mappings

### 1. Show unassigned issues from backlog
**JQL Query:**
```jql
assignee IS EMPTY
```
**Result:** Returns all issues where the assignee field is null/empty
**Test Result:** ✅ Found 2 unassigned issues

---

### 2. Show unassigned issues for the sprint ABC from backlog
**JQL Query:**
```jql
assignee IS EMPTY AND sprint = "ABC"
```
**Result:** Returns unassigned issues that belong to sprint "ABC"
**Test Result:** ✅ Query works (no matches for "ABC" in sample data)

---

### 3. Show my issues from backlog
**JQL Query:**
```jql
assignee = currentUser()
```
**Usage:** Requires current user context parameter
**Test Result:** ✅ Found 1 issue when tested with "Douglas Almena" as current user

---

### 4. Show Kabita Sharma issues from backlog
**JQL Query:**
```jql
assignee = "Kabita Sharma"
```
**Result:** Returns issues assigned to the specific user
**Test Result:** ✅ Query works (no matches for "Kabita Sharma" in sample data)
**Alternative Test:** `assignee = "Douglas Almena"` found 1 issue

---

### 5. Show P0 issues from backlog
**JQL Query:**
```jql
priority = P0
```
**Result:** Returns all issues with P0 priority
**Test Result:** ✅ Found 4 P0 issues

---

### 6. Show Kabita Sharma for the sprint ABC from backlog
**JQL Query:**
```jql
assignee = "Kabita Sharma" AND sprint = "ABC"
```
**Result:** Returns issues assigned to "Kabita Sharma" in sprint "ABC"
**Test Result:** ✅ Query works (no matches for this combination in sample data)
**Alternative Test:** `assignee = "Douglas Almena" AND sprint = "25.3.5"` found 1 issue

## Implementation Functions

### Basic Usage
```typescript
import { getFilteredBacklogData } from './utils/demoUtils';

const jqlQuery = 'assignee IS EMPTY';
const results = getFilteredBacklogData(jsonData, jqlQuery);
```

### With Current User Context
```typescript
import { getDemoBacklogDataWithUser } from './utils/demoUtils';

const jqlQuery = 'assignee = currentUser()';
const currentUser = 'Douglas Almena';
const results = getDemoBacklogDataWithUser(jsonData, jqlQuery, currentUser);
```

## Supported JQL Syntax

- ✅ `assignee IS EMPTY` - Unassigned issues
- ✅ `assignee = "User Name"` - Specific user assignment
- ✅ `assignee = currentUser()` - Current user function
- ✅ `priority = P0` - Priority filtering
- ✅ `sprint = "Sprint Name"` - Sprint filtering
- ✅ `AND` operator - Combining conditions
- ✅ Case-insensitive matching
- ✅ Partial string matching for names and sprints

## Integration Ready

The functions are ready to be used in your `jiraService.ts` file. When `isDemo` is true and `forType` is 'backlog', you can pass the JQL query string directly to these functions to filter the JSON data accordingly.
