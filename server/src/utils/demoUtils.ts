interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
      };
    };
    assignee?: {
      displayName: string;
      emailAddress?: string;
    } | null;
    priority: {
      name: string;
      id: string;
    };
    customfield_10020?: Array<{
      name: string;
      state?: string;
    }>;
    [key: string]: any;
  };
}

interface WorklogEntry {
  id: string;
  author: {
    displayName: string;
    emailAddress: string;
    accountType: string;
  };
  updateAuthor: {
    displayName: string;
    emailAddress: string;
    accountType: string;
  };
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  issueId: string;
}

interface WorklogIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    assignee: {
      displayName: string;
      emailAddress: string;
    };
    worklog: {
      total: number;
      worklogs: WorklogEntry[];
    };
    priority: {
      name: string;
    };
    status: {
      name: string;
    };
    updated: string;
  };
}

interface WorklogData {
  issues: WorklogIssue[];
  total: number;
}

interface WorklogFilters {
  assignees?: string[]; // array of assignee names
  teamIds?: string[]; // array of team identifiers
  dateFrom?: Date;
  dateTo?: Date;
}

interface WorklogSummary {
  assignee: string;
  totalTimeSpentSeconds: number;
  totalTimeSpent: string;
  worklogCount: number;
  issues: Array<{
    key: string;
    summary: string;
    timeSpentSeconds: number;
    timeSpent: string;
    worklogEntries: Array<{
      date: string;
      timeSpent: string;
      timeSpentSeconds: number;
    }>;
  }>;
}

interface BacklogData {
  issues: JiraIssue[];
  total: number;
}

// JQL Query Parser
interface JqlFilters {
  assignee?: string | null; // null for unassigned, string for specific user
  priority?: string;
  sprint?: string;
  currentUser?: string; // for currentUser() function
}

// Enhanced JQL Query Parser with Status Support
interface JqlFiltersWithStatus extends JqlFilters {
  status?: string | string[]; // single status or array of statuses
  dateFrom?: Date; // start date for date range filtering
  dateTo?: Date; // end date for date range filtering
  dateField?: 'created' | 'updated'; // which date field to filter on
}

// JQL Query Parser and Filter - following getFilteredJiraIssues pattern
export const getDemoBacklogData = (jsonData: any, jqlQuery: string) => {
  const backlogData = jsonData as BacklogData;
  
  if (!backlogData || !backlogData.issues) {
    return {
      issues: [],
      total: 0,
      maxResults: 0,
      startAt: 0
    };
  }

  // Parse JQL query into filtering criteria
  const filters = parseJqlQuery(jqlQuery);
  
  // Filter issues based on parsed JQL criteria
  const filteredIssues = backlogData.issues.filter((issue: JiraIssue) => {
    return evaluateJqlFilters(issue, filters);
  });

  return {
    issues: filteredIssues,
    total: filteredIssues.length,
    maxResults: filteredIssues.length,
    startAt: 0
  };
}

export const getDemoJiraIssues = (jsonData: any, jqlQuery: string): JiraIssue[] => {
  if (!jsonData || !jsonData.issues) {
    return [];
  }

  // Parse JQL query into filtering criteria
  const filters = parseJqlQueryWithStatus(jqlQuery);
  
  // Filter issues based on parsed JQL criteria
  return jsonData.issues.filter((issue: JiraIssue) => {
    return evaluateJqlFiltersWithStatus(issue, filters);
  });
}


function parseJqlQuery(jql: string): JqlFilters {
  const filters: JqlFilters = {};
  const normalizedJql = jql.toLowerCase().trim();
  
  // Parse assignee conditions
  if (normalizedJql.includes('assignee is empty') || normalizedJql.includes('assignee = empty')) {
    filters.assignee = null; // unassigned
  } else if (normalizedJql.includes('assignee = currentuser()')) {
    filters.currentUser = 'CURRENT_USER'; // placeholder for current user
  } else {
    // Extract specific assignee name from quotes
    const assigneeMatch = normalizedJql.match(/assignee\s*=\s*["']([^"']+)["']/);
    if (assigneeMatch) {
      filters.assignee = assigneeMatch[1];
    }
  }
  
  // Parse priority conditions
  const priorityMatch = normalizedJql.match(/priority\s*=\s*["']?([^"'\s]+)["']?/);
  if (priorityMatch) {
    filters.priority = priorityMatch[1].toUpperCase();
  }
  
  // Parse sprint conditions - support both quoted and unquoted values
  const sprintMatch = normalizedJql.match(/sprint\s*=\s*["']?([^"'\s]+)["']?/);
  if (sprintMatch) {
    filters.sprint = sprintMatch[1];
  }
  
  return filters;
}

// Evaluate JQL filters against an issue
function evaluateJqlFilters(issue: JiraIssue, filters: JqlFilters): boolean {
  // Check assignee filter
  if (filters.assignee !== undefined) {
    if (filters.assignee === null) {
      // Unassigned filter
      if (issue.fields.assignee !== null && issue.fields.assignee !== undefined) {
        return false;
      }
    } else {
      // Specific assignee filter
      const assigneeDisplayName = issue.fields.assignee?.displayName || '';
      if (!assigneeDisplayName.toLowerCase().includes(filters.assignee.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Check current user filter (needs to be handled with context)
  if (filters.currentUser) {
    // This would need current user context passed separately
    // For now, return false as placeholder
    return false;
  }
  
  // Check priority filter
  if (filters.priority) {
    const issuePriority = issue.fields.priority?.name || '';
    if (issuePriority.toUpperCase() !== filters.priority) {
      return false;
    }
  }
  
  // Check sprint filter
  if (filters.sprint) {
    const issueSprint = issue.fields.customfield_10020?.[0]?.name || '';
    if (!issueSprint.toLowerCase().includes(filters.sprint.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

// Enhanced JQL parser with status support
function parseJqlQueryWithStatus(jql: string): JqlFiltersWithStatus {
  const filters: JqlFiltersWithStatus = {};
  const normalizedJql = jql.toLowerCase().trim();
  
  // Parse assignee conditions
  if (normalizedJql.includes('assignee is empty') || 
      normalizedJql.includes('assignee = empty') ||
      normalizedJql.includes('unassigned')) {
    filters.assignee = null; // unassigned
  } else if (normalizedJql.includes('assignee = currentuser()')) {
    filters.currentUser = 'CURRENT_USER'; // placeholder for current user
  } else {
    // Extract specific assignee name from quotes or plain text
    const assigneeMatch = normalizedJql.match(/assignee\s*=\s*["']([^"']+)["']/) || 
                          normalizedJql.match(/(?:for|assignee)\s+([a-zA-Z\s]+?)(?:\s+from|\s+in|\s*$)/);
    if (assigneeMatch) {
      filters.assignee = assigneeMatch[1].trim();
    }
  }
  
  // Parse priority conditions
  const priorityMatch = normalizedJql.match(/priority\s*=\s*["']?([^"'\s]+)["']?/);
  if (priorityMatch) {
    filters.priority = priorityMatch[1].toUpperCase();
  }
  
  // Parse sprint conditions - support both quoted and unquoted values
  const sprintMatch = normalizedJql.match(/sprint\s*=\s*["']?([^"'\s]+)["']?/) ||
                      normalizedJql.match(/from\s+sprint\s+["']?([^"'\s]+)["']?/) ||
                      normalizedJql.match(/sprint\s+["']?([^"'\s]+)["']?/);
  if (sprintMatch) {
    filters.sprint = sprintMatch[1];
  }
  
  // Parse status conditions - handle multiple statuses
  const statusPatterns = [
    'in progress', 'ready for release', 'done', 'cancelled', 'to do', 'new', 'blocked',
    'build', 'testing', 'review', 'deployed', 'open', 'closed'
  ];
  
  const foundStatuses: string[] = [];
  for (const status of statusPatterns) {
    if (normalizedJql.includes(status)) {
      foundStatuses.push(status);
    }
  }
  
  if (foundStatuses.length > 0) {
    filters.status = foundStatuses.length === 1 ? foundStatuses[0] : foundStatuses;
  }
  
  // Parse date range conditions
  const dateRangePatterns = [
    // Match patterns like "between 2024-01-01 and 2024-01-31"
    /between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/,
    // Match patterns like "from 2024-01-01 to 2024-01-31"
    /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/,
    // Match patterns like "between Jan 1, 2024 and Jan 31, 2024"
    /between\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})\s+and\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})/i,
    // Match patterns like "from Jan 1, 2024 to Jan 31, 2024"
    /from\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})\s+to\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of dateRangePatterns) {
    const dateMatch = normalizedJql.match(pattern);
    if (dateMatch) {
      try {
        filters.dateFrom = new Date(dateMatch[1]);
        filters.dateTo = new Date(dateMatch[2]);
        
        // Determine which date field to use (default to 'created')
        if (normalizedJql.includes('updated') || normalizedJql.includes('modified')) {
          filters.dateField = 'updated';
        } else {
          filters.dateField = 'created';
        }
        
        // Validate dates
        if (isNaN(filters.dateFrom.getTime()) || isNaN(filters.dateTo.getTime())) {
          // Invalid dates, remove them
          delete filters.dateFrom;
          delete filters.dateTo;
          delete filters.dateField;
        } else {
          // Set end of day for dateTo to include the entire day
          filters.dateTo.setHours(23, 59, 59, 999);
        }
        break;
      } catch (error) {
        // Invalid date format, continue to next pattern
        continue;
      }
    }
  }
  
  return filters;
}

// Enhanced evaluation function with status support
function evaluateJqlFiltersWithStatus(issue: JiraIssue, filters: JqlFiltersWithStatus): boolean {
  // Check assignee filter
  if (filters.assignee !== undefined) {
    if (filters.assignee === null) {
      // Unassigned filter
      if (issue.fields.assignee !== null && issue.fields.assignee !== undefined) {
        return false;
      }
    } else {
      // Specific assignee filter
      const assigneeDisplayName = issue.fields.assignee?.displayName || '';
      if (!assigneeDisplayName.toLowerCase().includes(filters.assignee.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Check current user filter (needs to be handled with context)
  if (filters.currentUser) {
    // This would need current user context passed separately
    // For now, return false as placeholder
    return false;
  }
  
  // Check priority filter
  if (filters.priority) {
    const issuePriority = issue.fields.priority?.name || '';
    if (issuePriority.toUpperCase() !== filters.priority) {
      return false;
    }
  }
  
  // Check sprint filter
  if (filters.sprint) {
    const issueSprint = issue.fields.customfield_10020?.[0]?.name || '';
    if (!issueSprint.toLowerCase().includes(filters.sprint.toLowerCase())) {
      return false;
    }
  }
  
  // Check status filter
  if (filters.status) {
    const issueStatus = issue.fields.status?.name || '';
    const issueStatusCategory = issue.fields.status?.statusCategory?.name || '';
    
    const statusesToCheck = Array.isArray(filters.status) ? filters.status : [filters.status];
    
    const matchesStatus = statusesToCheck.some(filterStatus => {
      const normalizedFilterStatus = filterStatus.toLowerCase();
      const normalizedIssueStatus = issueStatus.toLowerCase();
      const normalizedStatusCategory = issueStatusCategory.toLowerCase();
      
      // Direct status name match
      if (normalizedIssueStatus.includes(normalizedFilterStatus)) {
        return true;
      }
      
      // Map common status names to actual Jira statuses
      switch (normalizedFilterStatus) {
        case 'in progress':
          return normalizedStatusCategory === 'in progress' || 
                 normalizedIssueStatus.includes('build') ||
                 normalizedIssueStatus.includes('development') ||
                 normalizedIssueStatus.includes('testing');
        case 'to do':
        case 'new':
          return normalizedStatusCategory === 'new' || 
                 normalizedStatusCategory === 'to do' ||
                 normalizedIssueStatus.includes('open') ||
                 normalizedIssueStatus.includes('backlog');
        case 'done':
          return normalizedStatusCategory === 'done' || 
                 normalizedIssueStatus.includes('closed') ||
                 normalizedIssueStatus.includes('resolved') ||
                 normalizedIssueStatus.includes('complete');
        case 'blocked':
          return normalizedIssueStatus.includes('blocked') ||
                 normalizedIssueStatus.includes('impediment');
        case 'ready for release':
          return normalizedIssueStatus.includes('ready') ||
                 normalizedIssueStatus.includes('release');
        case 'cancelled':
          return normalizedIssueStatus.includes('cancelled') ||
                 normalizedIssueStatus.includes('rejected');
        default:
          return false;
      }
    });
    
    if (!matchesStatus) {
      return false;
    }
  }
  
  // Check date range filter
  if (filters.dateFrom && filters.dateTo && filters.dateField) {
    const dateFieldValue = issue.fields[filters.dateField];
    if (dateFieldValue) {
      const issueDate = new Date(dateFieldValue);
      if (isNaN(issueDate.getTime()) || issueDate < filters.dateFrom || issueDate > filters.dateTo) {
        return false;
      }
    } else {
      // If the date field doesn't exist on the issue, exclude it
      return false;
    }
  }
  
  return true;
}

// Enhanced function that supports current user context for JQL queries with currentUser()
export const getDemoBacklogDataWithUser = (jsonData: any, jqlQuery: string, currentUserDisplayName?: string) => {
  const backlogData = jsonData as BacklogData;
  
  if (!backlogData || !backlogData.issues) {
    return {
      issues: [],
      total: 0,
      maxResults: 0,
      startAt: 0
    };
  }

  // Parse JQL query and inject current user context
  const filters = parseJqlQuery(jqlQuery);
  
  // Filter issues based on parsed JQL criteria with user context
  const filteredIssues = backlogData.issues.filter((issue: JiraIssue) => {
    return evaluateJqlFiltersWithUser(issue, filters, currentUserDisplayName);
  });

  return {
    issues: filteredIssues,
    total: filteredIssues.length,
    maxResults: filteredIssues.length,
    startAt: 0
  };
}

// Evaluate JQL filters with current user context
function evaluateJqlFiltersWithUser(issue: JiraIssue, filters: JqlFilters, currentUserDisplayName?: string): boolean {
  // Check assignee filter
  if (filters.assignee !== undefined) {
    if (filters.assignee === null) {
      // Unassigned filter
      if (issue.fields.assignee !== null && issue.fields.assignee !== undefined) {
        return false;
      }
    } else {
      // Specific assignee filter
      const assigneeDisplayName = issue.fields.assignee?.displayName || '';
      if (!assigneeDisplayName.toLowerCase().includes(filters.assignee.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Check current user filter
  if (filters.currentUser && currentUserDisplayName) {
    const assigneeDisplayName = issue.fields.assignee?.displayName || '';
    if (!assigneeDisplayName.toLowerCase().includes(currentUserDisplayName.toLowerCase())) {
      return false;
    }
  }
  
  // Check priority filter
  if (filters.priority) {
    const issuePriority = issue.fields.priority?.name || '';
    if (issuePriority.toUpperCase() !== filters.priority) {
      return false;
    }
  }
  
  // Check sprint filter
  if (filters.sprint) {
    const issueSprint = issue.fields.customfield_10020?.[0]?.name || '';
    if (!issueSprint.toLowerCase().includes(filters.sprint.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

// Helper function to get demo data with JQL query filtering
export const getFilteredBacklogData = (jsonData: any, jqlQuery: string) => {
  return getDemoBacklogData(jsonData, jqlQuery);
}

// Helper function with user context
export const getFilteredBacklogDataWithUser = (jsonData: any, jqlQuery: string, currentUserDisplayName?: string) => {
  return getDemoBacklogDataWithUser(jsonData, jqlQuery, currentUserDisplayName);
}

// Helper function specifically for the processed JSON data format
export const getFilteredJiraIssues = (jsonData: any, jqlQuery: string) => {
  const filteredIssues = getDemoJiraIssues(jsonData, jqlQuery);
  
  return {
    issues: filteredIssues,
    total: filteredIssues.length,
    maxResults: filteredIssues.length,
    startAt: 0
  };
}

// Enhanced version with user context for processed JSON data
export const getDemoJiraIssuesWithUser = (jsonData: any, jqlQuery: string, currentUserDisplayName?: string): JiraIssue[] => {
  if (!jsonData || !jsonData.issues) {
    return [];
  }

  // Parse JQL query into filtering criteria
  const filters = parseJqlQueryWithStatus(jqlQuery);
  
  // Filter issues based on parsed JQL criteria with user context
  return jsonData.issues.filter((issue: JiraIssue) => {
    return evaluateJqlFiltersWithStatusAndUser(issue, filters, currentUserDisplayName);
  });
}

// Enhanced evaluation function with status and user support
function evaluateJqlFiltersWithStatusAndUser(issue: JiraIssue, filters: JqlFiltersWithStatus, currentUserDisplayName?: string): boolean {
  // Check assignee filter
  if (filters.assignee !== undefined) {
    if (filters.assignee === null) {
      // Unassigned filter
      if (issue.fields.assignee !== null && issue.fields.assignee !== undefined) {
        return false;
      }
    } else {
      // Specific assignee filter
      const assigneeDisplayName = issue.fields.assignee?.displayName || '';
      if (!assigneeDisplayName.toLowerCase().includes(filters.assignee.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Check current user filter
  if (filters.currentUser && currentUserDisplayName) {
    const assigneeDisplayName = issue.fields.assignee?.displayName || '';
    if (!assigneeDisplayName.toLowerCase().includes(currentUserDisplayName.toLowerCase())) {
      return false;
    }
  }
  
  // Check priority filter
  if (filters.priority) {
    const issuePriority = issue.fields.priority?.name || '';
    if (issuePriority.toUpperCase() !== filters.priority) {
      return false;
    }
  }
  
  // Check sprint filter
  if (filters.sprint) {
    const issueSprint = issue.fields.customfield_10020?.[0]?.name || '';
    if (!issueSprint.toLowerCase().includes(filters.sprint.toLowerCase())) {
      return false;
    }
  }
  
  // Check status filter (same logic as before)
  if (filters.status) {
    const issueStatus = issue.fields.status?.name || '';
    const issueStatusCategory = issue.fields.status?.statusCategory?.name || '';
    
    const statusesToCheck = Array.isArray(filters.status) ? filters.status : [filters.status];
    
    const matchesStatus = statusesToCheck.some(filterStatus => {
      const normalizedFilterStatus = filterStatus.toLowerCase();
      const normalizedIssueStatus = issueStatus.toLowerCase();
      const normalizedStatusCategory = issueStatusCategory.toLowerCase();
      
      // Direct status name match
      if (normalizedIssueStatus.includes(normalizedFilterStatus)) {
        return true;
      }
      
      // Map common status names to actual Jira statuses
      switch (normalizedFilterStatus) {
        case 'in progress':
          return normalizedStatusCategory === 'in progress' || 
                 normalizedIssueStatus.includes('build') ||
                 normalizedIssueStatus.includes('development') ||
                 normalizedIssueStatus.includes('testing');
        case 'to do':
        case 'new':
          return normalizedStatusCategory === 'new' || 
                 normalizedStatusCategory === 'to do' ||
                 normalizedIssueStatus.includes('open') ||
                 normalizedIssueStatus.includes('backlog');
        case 'done':
          return normalizedStatusCategory === 'done' || 
                 normalizedIssueStatus.includes('closed') ||
                 normalizedIssueStatus.includes('resolved') ||
                 normalizedIssueStatus.includes('complete');
        case 'blocked':
          return normalizedIssueStatus.includes('blocked') ||
                 normalizedIssueStatus.includes('impediment');
        case 'ready for release':
          return normalizedIssueStatus.includes('ready') ||
                 normalizedIssueStatus.includes('release');
        case 'cancelled':
          return normalizedIssueStatus.includes('cancelled') ||
                 normalizedIssueStatus.includes('rejected');
        default:
          return false;
      }
    });
    
    if (!matchesStatus) {
      return false;
    }
  }
  
  // Check date range filter
  if (filters.dateFrom && filters.dateTo && filters.dateField) {
    const dateFieldValue = issue.fields[filters.dateField];
    if (dateFieldValue) {
      const issueDate = new Date(dateFieldValue);
      if (isNaN(issueDate.getTime()) || issueDate < filters.dateFrom || issueDate > filters.dateTo) {
        return false;
      }
    } else {
      // If the date field doesn't exist on the issue, exclude it
      return false;
    }
  }
  
  return true;
}

// Helper function with user context for processed JSON data
export const getFilteredJiraIssuesWithUser = (jsonData: any, jqlQuery: string, currentUserDisplayName?: string) => {
  const filteredIssues = getDemoJiraIssuesWithUser(jsonData, jqlQuery, currentUserDisplayName);
  
  return {
    issues: filteredIssues,
    total: filteredIssues.length,
    maxResults: filteredIssues.length,
    startAt: 0
  };
}

// ============================================================================
// WORKLOG FUNCTIONALITY
// ============================================================================

// Parse worklog query to extract filters
function parseWorklogQuery(jqlQuery: string): WorklogFilters {
  const filters: WorklogFilters = {};
  const normalizedQuery = jqlQuery.toLowerCase().trim();
  
  // Parse assignee(s) - handle both single and multiple assignees
  const assigneePatterns = [
    /(?:for|assignee)\s+([a-zA-Z\s,]+?)(?:\s+for\s+the\s+period|\s+between|\s+from|\s*$)/,
    /worklog\s+summary\s+for\s+([a-zA-Z\s,]+?)(?:\s+for\s+the\s+period|\s+between|\s+from|\s*$)/
  ];
  
  for (const pattern of assigneePatterns) {
    const assigneeMatch = normalizedQuery.match(pattern);
    if (assigneeMatch) {
      const assigneeString = assigneeMatch[1].trim();
      // Handle multiple assignees separated by commas or "and"
      const assignees = assigneeString
        .split(/,|\s+and\s+/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (assignees.length > 0) {
        filters.assignees = assignees;
      }
      break;
    }
  }
  
  // Parse team IDs
  const teamMatch = normalizedQuery.match(/team\s+ids?\s+([a-zA-Z0-9\s,]+?)(?:\s+for|\s+between|\s+from|\s*$)/);
  if (teamMatch) {
    const teamString = teamMatch[1].trim();
    const teamIds = teamString
      .split(/,|\s+and\s+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (teamIds.length > 0) {
      filters.teamIds = teamIds;
    }
  }
  
  // Parse date range conditions
  const dateRangePatterns = [
    /(?:for\s+the\s+period\s+of|between)\s+(\d{4}-\d{2}-\d{2})\s+(?:to|and)\s+(\d{4}-\d{2}-\d{2})/,
    /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/,
    /(?:for\s+the\s+period\s+of|between)\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})\s+(?:to|and)\s+([a-z]{3}\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of dateRangePatterns) {
    const dateMatch = normalizedQuery.match(pattern);
    if (dateMatch) {
      try {
        filters.dateFrom = new Date(dateMatch[1]);
        filters.dateTo = new Date(dateMatch[2]);
        
        // Validate dates
        if (isNaN(filters.dateFrom.getTime()) || isNaN(filters.dateTo.getTime())) {
          delete filters.dateFrom;
          delete filters.dateTo;
        } else {
          // Set end of day for dateTo to include the entire day
          filters.dateTo.setHours(23, 59, 59, 999);
        }
        break;
      } catch (error) {
        // Invalid date format, continue to next pattern
        continue;
      }
    }
  }
  
  return filters;
}

// Convert seconds to readable time format
function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

// Main worklog summary function
export const getWorklogSummary = (worklogData: any, jqlQuery: string): WorklogSummary[] => {
  const data = worklogData as WorklogData;
  
  if (!data || !data.issues) {
    return [];
  }
  
  const filters = parseWorklogQuery(jqlQuery);
  const summaryMap = new Map<string, WorklogSummary>();
  
  // Process each issue and its worklogs
  data.issues.forEach(issue => {
    if (!issue.fields.worklog || !issue.fields.worklog.worklogs) {
      return;
    }
    
    issue.fields.worklog.worklogs.forEach(worklog => {
      const authorName = worklog.author.displayName;
      
      // Apply assignee filter
      if (filters.assignees && filters.assignees.length > 0) {
        const matchesAssignee = filters.assignees.some(assignee => 
          authorName.toLowerCase().includes(assignee.toLowerCase())
        );
        if (!matchesAssignee) {
          return;
        }
      }
      
      // Apply team filter (for now, we'll use a simple mapping or skip if no team data)
      if (filters.teamIds && filters.teamIds.length > 0) {
        // Since we don't have explicit team data, we'll skip this filter
        // In a real implementation, you'd have team mapping data
        return;
      }
      
      // Apply date filter
      if (filters.dateFrom && filters.dateTo) {
        const worklogDate = new Date(worklog.started);
        if (worklogDate < filters.dateFrom || worklogDate > filters.dateTo) {
          return;
        }
      }
      
      // Add to summary
      if (!summaryMap.has(authorName)) {
        summaryMap.set(authorName, {
          assignee: authorName,
          totalTimeSpentSeconds: 0,
          totalTimeSpent: '',
          worklogCount: 0,
          issues: []
        });
      }
      
      const summary = summaryMap.get(authorName)!;
      summary.totalTimeSpentSeconds += worklog.timeSpentSeconds;
      summary.worklogCount++;
      
      // Find or create issue entry
      let issueEntry = summary.issues.find(i => i.key === issue.key);
      if (!issueEntry) {
        issueEntry = {
          key: issue.key,
          summary: issue.fields.summary,
          timeSpentSeconds: 0,
          timeSpent: '',
          worklogEntries: []
        };
        summary.issues.push(issueEntry);
      }
      
      issueEntry.timeSpentSeconds += worklog.timeSpentSeconds;
      issueEntry.worklogEntries.push({
        date: worklog.started,
        timeSpent: worklog.timeSpent,
        timeSpentSeconds: worklog.timeSpentSeconds
      });
    });
  });
  
  // Format time spent strings
  summaryMap.forEach(summary => {
    summary.totalTimeSpent = formatTimeSpent(summary.totalTimeSpentSeconds);
    summary.issues.forEach(issue => {
      issue.timeSpent = formatTimeSpent(issue.timeSpentSeconds);
    });
  });
  
  return Array.from(summaryMap.values()).sort((a, b) => 
    b.totalTimeSpentSeconds - a.totalTimeSpentSeconds
  );
}

// Helper function that returns formatted worklog summary - following getFilteredJiraIssues pattern
export const getFormattedWorklogSummary = (worklogData: any, jqlQuery: string) => {
  // Parse JQL query into filtering criteria
  const filters = parseJqlQueryWithStatus(jqlQuery);
  const data = worklogData as WorklogData;
  if (!data || !data.issues) {
    return {
      expand: "schema,names",
      issues: [],
      total: 0,
      maxResults: 0,
      startAt: 0
    };
  }
  // Custom filter for WorklogIssue fields
  const filteredIssues = data.issues.filter((issue: WorklogIssue) => {
    // Assignee filter
    if (filters.assignee !== undefined) {
      // WorklogIssue doesn't have assignee, skip
      return false;
    }
    // Status filter
    if (filters.status) {
      const issueStatus = issue.fields.status?.name || '';
      const statusesToCheck = Array.isArray(filters.status) ? filters.status : [filters.status];
      const matchesStatus = statusesToCheck.some(filterStatus => {
        return issueStatus.toLowerCase().includes(filterStatus.toLowerCase());
      });
      if (!matchesStatus) {
        return false;
      }
    }
    // Date filter (WorklogIssue only has 'updated')
    if (filters.dateFrom && filters.dateTo) {
      const issueDate = new Date(issue.fields.updated);
      if (isNaN(issueDate.getTime()) || issueDate < filters.dateFrom || issueDate > filters.dateTo) {
        return false;
      }
    }
    return true;
  });
  return {
    expand: "schema,names",
    issues: filteredIssues,
    total: filteredIssues.length,
    maxResults: filteredIssues.length,
    startAt: 0
  };
}

// ============================================================================
// UNIFIED DEMO FUNCTIONS WITH forType SUPPORT
// ============================================================================

// Main unified function that handles both 'worklog' and 'general' data types
export const getDemoData = (jsonData: any, jqlQuery: string, forType: 'worklog' | 'general'): any => {
  if (forType === 'worklog') {
    return getFormattedWorklogSummary(jsonData, jqlQuery);
  } else if (forType === 'general') {
    return getFilteredJiraIssues(jsonData, jqlQuery);
  } else {
    throw new Error(`Unsupported forType: ${forType}. Must be 'worklog' or 'general'.`);
  }
}

// Unified function with user context support
export const getDemoDataWithUser = (jsonData: any, jqlQuery: string, forType: 'worklog' | 'general', currentUserDisplayName?: string): any => {
  if (forType === 'worklog') {
    // Worklog doesn't currently use user context, but could be extended
    return getFormattedWorklogSummary(jsonData, jqlQuery);
  } else if (forType === 'general') {
    return getFilteredJiraIssuesWithUser(jsonData, jqlQuery, currentUserDisplayName);
  } else {
    throw new Error(`Unsupported forType: ${forType}. Must be 'worklog' or 'general'.`);
  }
}

// Type-safe wrapper that ensures correct return types
export const getTypedDemoData = (jsonData: any, jqlQuery: string, forType: 'worklog' | 'general') => {
  if (forType === 'worklog') {
    return getFormattedWorklogSummary(jsonData, jqlQuery);
  } else {
    return getFilteredJiraIssues(jsonData, jqlQuery);
  }
}