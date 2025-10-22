export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      name: string;
      id: string;
    };
    priority?: {
      name: string;
      id: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    issuetype: {
      name: string;
      id: string;
    };
    project: {
      key: string;
      name: string;
    };
    sprint?: {
      id: number;
      name: string;
      state: string;
    };
    worklog?: {
      worklogs: any[];
      total: number;
    };
    storyPoints?: number;
    customfield_10016?: number; // Common story points custom field
    // Allow any additional custom fields
    [key: string]: any;
  };
}

export interface JiraIssueCreate {
  summary: string;
  description: string;
  issueType?: string;
  [key: string]: any;
}

export interface JiraIssueUpdate {
  summary?: string;
  description?: string;
  [key: string]: any;
}

// Raw JIRA API response structure for search
export interface JiraRawIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    description?: any;
    status?: {
      name?: string;
      id?: string;
    };
    priority?: {
      name?: string;
      id?: string;
    };
    assignee?: {
      displayName?: string;
      emailAddress?: string;
    };
    reporter?: {
      displayName?: string;
      emailAddress?: string;
    };
    created?: string;
    updated?: string;
    issuetype?: {
      name?: string;
      id?: string;
    };
    project?: {
      key?: string;
      name?: string;
    };
    sprint?: any;
    customfield_10020?: any; // Common sprint field
    customfield_10021?: any; // Alternative sprint field
    worklog?: {
      worklogs?: any[];
      total?: number;
    };
    storyPoints?: number;
    customfield_10016?: number; // Common story points custom field
    'Story Points'?: number; // Direct field name mapping
    // Allow any additional custom fields
    [key: string]: any;
  };
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

export interface StoryPointsSummary {
  assignee: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
  inProgressStoryPoints: number;
  todoStoryPoints: number;
  issueCount: number;
  issues: {
    key: string;
    summary: string;
    storyPoints: number;
    status: string;
  }[];
}
