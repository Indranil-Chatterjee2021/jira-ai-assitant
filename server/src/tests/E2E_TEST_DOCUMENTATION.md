# JIRA AI Assistant E2E Test Documentation

## Overview
This document describes the comprehensive End-to-End (E2E) test suite for the JIRA AI Assistant, which includes 18 specialized test cases (6 for each data source) plus additional system tests.

## Test Data Sources

### 1. Worklog Data (`jiraWorklogData.json`)
Contains JIRA issues with detailed worklog information including time tracking, user assignments, and work patterns.

### 2. Backlog Data (`jiraBacklogSampleData.json`)
Contains structured backlog items with sprint planning, epic hierarchies, and team assignments.

### 3. General Issues (`jiraIssues_processed.json`)
Contains comprehensive JIRA issues with complex field structures, custom fields, and relationships.

## Test Categories

## 🕐 Worklog Related Queries (WL-1 to WL-6)

### WL-1: User-Specific Worklog Summary
**Query**: `"show me worklog summary for Bindu Divakara for the last month"`
**Purpose**: Tests user-specific time tracking analysis
**Validates**:
- User identification and filtering
- Time aggregation across periods
- Worklog entry structure
- User display name matching

### WL-2: Multi-User Worklog Comparison
**Query**: `"compare worklog hours between Rajagopal Govindaraj and John Smith in August 2025"`
**Purpose**: Tests comparative analysis between team members
**Validates**:
- Multiple user filtering
- Time period constraints
- Comparative data structure
- Hour calculation accuracy

### WL-3: Issue-Specific Time Tracking
**Query**: `"show time spent on issue TEST-142319 with worklog details"`
**Purpose**: Tests issue-level time tracking analysis
**Validates**:
- Issue-specific worklog retrieval
- Detailed worklog entry structure
- Time tracking metadata
- Issue-worklog relationship

### WL-4: Daily Worklog Breakdown
**Query**: `"show daily worklog breakdown for all users from August 1st to August 10th, 2025"`
**Purpose**: Tests temporal worklog analysis
**Validates**:
- Date range filtering
- Daily time distribution
- Multiple user aggregation
- Temporal data structure

### WL-5: Time Zone Analysis
**Query**: `"analyze worklog entries by time zones and show distribution of work hours"`
**Purpose**: Tests geographical work pattern analysis
**Validates**:
- Time zone identification
- Work distribution patterns
- User location data
- Temporal analysis across zones

### WL-6: Team Efficiency Metrics
**Query**: `"show team worklog efficiency metrics including average hours per day and total project time for issues with multiple worklogs"`
**Purpose**: Tests team productivity analysis
**Validates**:
- Team-level aggregation
- Efficiency calculations
- Multi-worklog issue handling
- Performance metrics

## 📋 Backlog Related Queries (BL-1 to BL-6)

### BL-1: Epic-Level Planning
**Query**: `"show epic TEST-121159 with all sub-tasks and their current status for sprint planning"`
**Purpose**: Tests hierarchical issue structure analysis
**Validates**:
- Epic-task relationships
- Status tracking
- Sprint planning data
- Hierarchical structure

### BL-2: Sprint Capacity Planning
**Query**: `"show all tasks assigned to TEST TEAM for sprint 25.3.5 with story points and time estimates"`
**Purpose**: Tests sprint planning and capacity management
**Validates**:
- Team assignment filtering
- Sprint-specific data
- Story point estimation
- Time estimate validation

### BL-3: Priority and Dependency Analysis
**Query**: `"analyze priority distribution and dependencies for authentication module backlog items"`
**Purpose**: Tests priority management and dependency tracking
**Validates**:
- Priority level analysis
- Dependency relationship mapping
- Module-specific filtering
- Link structure validation

### BL-4: Team Workload Distribution
**Query**: `"show workload distribution across team members for upcoming sprint with unassigned items"`
**Purpose**: Tests team capacity and assignment analysis
**Validates**:
- Team member workload
- Unassigned item identification
- Capacity distribution
- Assignment status tracking

### BL-5: Backlog Refinement
**Query**: `"show items without story points or time estimates that need refinement in the backlog"`
**Purpose**: Tests backlog grooming and estimation gaps
**Validates**:
- Missing estimation identification
- Refinement needs assessment
- Data completeness checking
- Estimation field validation

### BL-6: Release Planning
**Query**: `"show backlog items by fix version and release readiness status for upcoming releases"`
**Purpose**: Tests release planning and version management
**Validates**:
- Version-based filtering
- Release readiness assessment
- Status categorization
- Version tracking

## 🔍 General Issue Queries (GQ-1 to GQ-6)

### GQ-1: Comprehensive Issue Search
**Query**: `"show all high priority issues in MSC project assigned to active users with recent activity"`
**Purpose**: Tests complex multi-criteria filtering
**Validates**:
- Priority-based filtering
- Project-specific searches
- User status filtering
- Activity-based queries

### GQ-2: Status Transition Analysis
**Query**: `"analyze issues by status transitions and show workflow bottlenecks for Media Supply Chain project"`
**Purpose**: Tests workflow analysis and bottleneck identification
**Validates**:
- Status transition tracking
- Workflow analysis
- Project-specific filtering
- Transition metadata

### GQ-3: Component and Label Categorization
**Query**: `"show issues grouped by components and labels for better categorization and reporting"`
**Purpose**: Tests categorization and grouping capabilities
**Validates**:
- Component-based grouping
- Label-based categorization
- Custom field analysis
- Reporting structure

### GQ-4: Custom Field Analysis
**Query**: `"analyze custom field usage including team assignments, story points, and sprint data for reporting dashboard"`
**Purpose**: Tests custom field handling and analysis
**Validates**:
- Custom field extraction
- Team assignment data
- Sprint information
- Dashboard data structure

### GQ-5: Temporal Trend Analysis
**Query**: `"show temporal trends in issue creation, resolution, and update patterns over the last quarter"`
**Purpose**: Tests time-based pattern analysis
**Validates**:
- Temporal data extraction
- Trend identification
- Date range handling
- Pattern analysis

### GQ-6: Cross-Project Relationships
**Query**: `"analyze cross-project dependencies and issue relationships including parent-child hierarchies and linked issues"`
**Purpose**: Tests complex relationship analysis
**Validates**:
- Cross-project links
- Hierarchical relationships
- Issue link types
- Dependency mapping

## 🛠️ System Tests

### Core System Tests
- Basic query workflow validation
- Error handling for invalid queries
- Missing parameter handling

### JQL Generation Tests
- JQL syntax validation
- Query type differentiation
- Parameter injection testing

### Security Tests
- CORS header validation
- Security header checking
- Input sanitization

### Performance Tests
- Response time validation
- Concurrent request handling
- Load testing capabilities

### Integration Tests
- Full workflow validation
- Token usage tracking
- Health monitoring

## 📊 Data Validation

### Structure Validation Functions
- `validateIssueStructure()`: Basic issue structure validation
- `validateWorklogStructure()`: Worklog-specific validation
- `validateBacklogIssue()`: Backlog item validation
- `validateProcessedIssue()`: Complex issue validation

### Validation Coverage
- Response structure integrity
- Data type validation
- Required field presence
- Relationship consistency
- Custom field validation

## 🚀 Running the Tests

```bash
# Run all E2E tests
npm test -- e2e.test.ts

# Run specific test categories
npm test -- e2e.test.ts -t "Worklog Related Queries"
npm test -- e2e.test.ts -t "Backlog Related Queries"
npm test -- e2e.test.ts -t "General Issue Queries"

# Run with verbose output
npm test -- e2e.test.ts --verbose

# Run with coverage
npm test -- e2e.test.ts --coverage
```

## 📈 Test Metrics

### Coverage Areas
- ✅ Worklog functionality (6 tests)
- ✅ Backlog management (6 tests)
- ✅ General issue handling (6 tests)
- ✅ System reliability (8 tests)
- ✅ Data validation (6 tests)

### Total Test Count: 32 comprehensive E2E tests

### Success Criteria
- All queries return valid JQL
- Response structures match expected schemas
- Error handling works correctly
- Performance requirements are met
- Security headers are present

## 🔧 Troubleshooting

### Common Issues
1. **Timeout Errors**: Increase Jest timeout for complex queries
2. **Authentication**: Ensure JIRA credentials are configured
3. **Data Availability**: Verify test data files are accessible
4. **Network Issues**: Check API connectivity

### Debug Mode
Enable detailed logging by setting `DEBUG=true` in environment variables.

## 📝 Test Maintenance

### Regular Updates
- Review test queries for relevance
- Update validation schemas as APIs evolve
- Monitor test performance and optimize as needed
- Add new test cases for new features

### Best Practices
- Keep test data realistic but anonymized
- Maintain clear test descriptions
- Use descriptive variable names
- Document complex validation logic
- Regular test review and refactoring
