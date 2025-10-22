// import axios, { AxiosError, AxiosResponse } from 'axios';
import { createJiraClient } from "../utils/apiHelpers";
import { parseTimeSpent } from "../utils/timeParser";
import {
  JiraIssue,
  JiraRawIssue,
  JiraSearchResponse,
  StoryPointsSummary,
} from "../types/jiraTypes";
import * as fs from "fs";
import * as path from "path";
import {
  getDemoBacklogData,
  getDemoData,
  getFormattedWorklogSummary,
  getFilteredJiraIssues,
} from "../utils/demoUtils";

interface WorklogEntry {
  author: {
    displayName: string;
    emailAddress: string;
  };
  timeSpentSeconds: number;
  started: string;
}

interface WorklogResponse {
  worklogs: WorklogEntry[];
  total: number;
}

export interface WorklogSummary {
  user: string;
  totalHours: number;
  totalMinutes: number;
  entries: number;
}

export async function fetchJiraIssues(
  jql: string,
  maxResults: number = 50,
  forType?: string
): Promise<JiraSearchResponse> {
  try {
    // JQL query execution (removed verbose logging)

    // const jiraBaseUrl = process.env.JIRA_BASE_URL;
    // const jiraEmail = process.env.JIRA_EMAIL;
    // const jiraApiToken = process.env.JIRA_API_TOKEN;
    // const isDemo = JSON.parse(process.env.IS_DEMO || 'false') as boolean;

    // if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
    //   throw new Error('JIRA configuration is missing. Please check environment variables.');
    // }
    const jiraClient = createJiraClient();
    const isDemo = JSON.parse(process.env.IS_DEMO || "false") as boolean;

    // let response: AxiosResponse<any, any>
    let response: any;
    if (isDemo && forType) {
      let responseData: any;
      let filePath: string;
      // Read data from local JSON file for demo purposes
      if (forType === "worklog") {
        filePath = path.join(__dirname, "../../../jiraWorklogData.json");
        const parsedWorklogData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        responseData = getFormattedWorklogSummary(parsedWorklogData, jql);
      } else if (forType === "backlog") {
        filePath = path.join(
          __dirname,
          "../../../../jiraBacklogSampleData.json"
        );
        const parsedBacklogData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        responseData = getDemoBacklogData(parsedBacklogData, jql);
      } else if (forType === "general") {
        filePath = path.join(
          __dirname,
          "../../../../jiraIssues_processed.json"
        );
        const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const filteredData = getFilteredJiraIssues(rawData, jql);
        responseData = filteredData || {
          issues: [],
          total: 0,
          maxResults: 0,
          // let response: AxiosResponse<any, any>
        };
      }
      // response = {
      //   data: responseData,
      //   status: 200,
      //   statusText: 'OK',
      //   headers: {},
      //   config: {}
      // } as AxiosResponse<any, any>;
      response = { data: responseData };
    } else {
      // response = await axios.get(`${jiraBaseUrl}/rest/api/3/search`, {
      //   params: {
      //     jql,
      //     maxResults,
      //     fields: 'summary,description,status,priority,assignee,reporter,created,updated,issuetype,project,sprint,worklog,customfield_10020,customfield_10021'
      //   },
      //   headers: {
      //     Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json',
      //   },
      //   timeout: 10000, // 10 second timeout
      // });
        response = await jiraClient.get(`/rest/api/3/search/jql`, {
          params: {
            jql,
            maxResults,
            fields:
              "summary,description,status,priority,assignee,reporter,created,updated,issuetype,project,sprint,worklog,customfield_10020,customfield_10021,customfield_10016,Story Points",
          },
        });
      }    const data: {
      issues: JiraRawIssue[];
      total: number;
      maxResults: number;
      startAt: number;
    } = response.data;

    // Check if data.issues exists and is an array to prevent "unable to read map" error
    // if (!data.issues || !Array.isArray(data.issues)) {
    //   console.warn('No issues found in response data or issues is not an array');
    //   return {
    //     issues: [],
    //     total: 0,
    //     maxResults: 0,
    //     startAt: 0
    //   } as JiraSearchResponse;
    // }

    // Transform the data to ensure consistent format
    const transformedIssues = data.issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      fields: {
        summary: issue.fields.summary || "No summary",
        description: issue.fields.description,
        status: {
          name: issue.fields.status?.name || "Unknown",
          id: issue.fields.status?.id || "",
        },
        priority: issue.fields.priority
          ? {
              name: issue.fields.priority.name,
              id: issue.fields.priority.id,
            }
          : undefined,
        assignee: issue.fields.assignee
          ? {
              displayName: issue.fields.assignee.displayName,
              emailAddress: issue.fields.assignee.emailAddress,
            }
          : undefined,
        reporter: issue.fields.reporter
          ? {
              displayName: issue.fields.reporter.displayName,
              emailAddress: issue.fields.reporter.emailAddress,
            }
          : undefined,
        created: issue.fields.created,
        updated: issue.fields.updated,
        issuetype: {
          name: issue.fields.issuetype?.name || "Unknown",
          id: issue.fields.issuetype?.id || "",
        },
        project: {
          key: issue.fields.project?.key || "Unknown",
          name: issue.fields.project?.name || "Unknown",
        },
        sprint: (() => {
          // Try multiple possible sprint field locations
          const sprintField =
            issue.fields.sprint ||
            issue.fields.customfield_10020 ||
            issue.fields.customfield_10021;

          if (sprintField) {
            // Handle array of sprints (take the last/current one)
            const sprint = Array.isArray(sprintField)
              ? sprintField[sprintField.length - 1]
              : sprintField;

            if (sprint && typeof sprint === "object") {
              return {
                id: sprint.id || 0,
                name: sprint.name || "Unknown Sprint",
                state: sprint.state || "unknown",
              };
            }
          }

          // No mock data needed - using real sprint data when available

          return undefined;
        })(),
        worklog: issue.fields.worklog
          ? {
              worklogs: issue.fields.worklog.worklogs || [],
              total: issue.fields.worklog.total || 0,
            }
          : undefined,
        storyPoints: (() => {
          // Try multiple possible story points field locations
          const storyPoints = 
            issue.fields['Story Points'] ||
            issue.fields.customfield_10016 ||
            issue.fields.storyPoints;
          
          return typeof storyPoints === 'number' ? storyPoints : undefined;
        })(),
      },
    }));

    // Successfully processed issues (removed verbose logging)

    return {
      issues: transformedIssues,
      total: data.total,
      maxResults: data.maxResults,
      startAt: data.startAt,
    } as JiraSearchResponse;
  } catch (error) {
    console.error("Error fetching JIRA issues:", error);

    // if (axios.isAxiosError(error)) {
    //   const axiosError = error as AxiosError;
    //   if (axiosError.response) {
    //     console.error('JIRA API Error:', axiosError.response.status, axiosError.response.data);
    //     throw new Error(`JIRA API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
    //   } else if (axiosError.request) {
    //     throw new Error('Unable to connect to JIRA. Please check your network connection and JIRA URL.');
    //   }
    // }
    // if (error && error.error) {
    //   throw new Error(`JIRA API Error: ${error.status} - ${error.error}`);
    // }

    throw new Error(
      `Failed to fetch JIRA issues: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Additional service functions for CRUD operations
export async function getIssues(
  projectKey?: string
): Promise<JiraSearchResponse> {
  const jql = projectKey
    ? `project = "${projectKey}"`
    : "order by updated DESC";
  return fetchJiraIssues(jql, 20);
}

export async function createIssue(issueData: any): Promise<any> {
  try {
    // const response = await axios.post(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, issueData, {
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    // return response.data;
    const jiraClient = createJiraClient();
    const response = await jiraClient.post(`/rest/api/3/issue`, issueData);
    return response.data;
  } catch (error) {
    console.error("Error creating JIRA issue:", error);
    throw error;
  }
}

export async function updateIssue(
  issueKey: string,
  updateData: any
): Promise<any> {
  try {
    // const response = await axios.put(`${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, updateData, {
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    // return response.data;
    const jiraClient = createJiraClient();
    const response = await jiraClient.put(
      `/rest/api/3/issue/${issueKey}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating JIRA issue:", error);
    throw error;
  }
}

export async function calculateWorklogHours(
  jql: string,
  userNames: string[],
  startDate: string,
  endDate: string
): Promise<WorklogSummary[]> {
  try {
    console.log(`🔍 Calculating worklog hours with JQL: ${jql}`);

    if (userNames.length > 0) {
      console.log(`👥 Target users: [${userNames.join(", ")}]`);
    } else {
      console.log(`👥 Target users: All users (no filter)`);
    }

    if (startDate && endDate) {
      console.log(`📅 Date range: ${startDate} to ${endDate}`);
    } else {
      console.log(`📅 Date range: All dates (no filter)`);
    }

    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    const isDemo = JSON.parse(process.env.IS_DEMO || "false") as boolean;

    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
      throw new Error("JIRA configuration is missing.");
    }

    // Use the JQL search API to get issues with worklogs directly
    // let response: AxiosResponse<any, any>
    let response: any;
    if (isDemo) {
      // Read data from local JSON file for demo purposes
      const worklogDataPath = path.join(
        __dirname,
        "../../../jiraWorklogData.json"
      );
      const worklogData = JSON.parse(fs.readFileSync(worklogDataPath, "utf8"));
      // response = {
      //   data: worklogData,
      //   status: 200,
      //   statusText: 'OK',
      //   headers: {},
      //   config: {}
      // } as AxiosResponse<any, any>;
      response = { data: worklogData };
    } else {
      // response = await axios.get(`${jiraBaseUrl}/rest/api/3/search`, {
      // params: {
      //   jql,
      //   maxResults: 1000,
      //   fields: 'worklog,key,summary'
      // },
      // headers: {
      //   Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
      //   'Content-Type': 'application/json',
      //   'Accept': 'application/json',
      // },
      // timeout: 15000,
      // });
      const jiraClient = createJiraClient();
      response = await jiraClient.get(`/rest/api/3/search/jql`, {
        params: {
          jql,
          maxResults: 1000,
          fields: "worklog,key,summary",
        },
      });
    }

    // Check if response.data.issues exists and is an array
    if (!response.data.issues || !Array.isArray(response.data.issues)) {
      console.warn(
        "No issues found in worklog response data or issues is not an array"
      );
      return [];
    }

    console.log(
      `📋 Found ${response.data.issues.length} issues from JQL query`
    );

    const worklogSummary: { [key: string]: WorklogSummary } = {};

    // Initialize summary for each user (only if specific users are provided)
    if (userNames.length > 0) {
      userNames.forEach((userName) => {
        worklogSummary[userName] = {
          user: userName,
          totalHours: 0,
          totalMinutes: 0,
          entries: 0,
        };
      });
    }

    let totalWorklogsProcessed = 0;
    let worklogsInDateRange = 0;
    let worklogsForTargetUsers = 0;

    // Process each issue's worklogs
    for (const issue of response.data.issues) {
      console.log(`Processing issue: ${issue.key}`);
      if (issue.fields.worklog && issue.fields.worklog.worklogs) {
        console.log(
          `Found ${issue.fields.worklog.worklogs.length} worklog(s) for ${issue.key}`
        );
        for (const worklog of issue.fields.worklog.worklogs) {
          totalWorklogsProcessed++;
          // Extract date strings for comparison (ignore time and timezone)
          const worklogDateStr = worklog.started.split("T")[0]; // Get YYYY-MM-DD
          const startDateStr = startDate; // Already in YYYY-MM-DD format
          const endDateStr = endDate; // Already in YYYY-MM-DD format

          // Check if worklog is within date range (if date filter is provided)
          const isInDateRange =
            !startDateStr ||
            !endDateStr ||
            (worklogDateStr >= startDateStr && worklogDateStr <= endDateStr);

          if (isInDateRange) {
            worklogsInDateRange++;

            // Check if worklog author matches any of our target users (if user filter is provided)
            const authorName = worklog.author.displayName;
            let matchedUser = null;

            if (userNames.length > 0) {
              // Specific user filtering
              matchedUser = userNames.find(
                (userName) =>
                  authorName.toLowerCase().includes(userName.toLowerCase()) ||
                  userName.toLowerCase().includes(authorName.toLowerCase())
              );
            } else {
              // No user filter - include all users
              matchedUser = authorName;
              // Initialize user in summary if not exists
              if (!worklogSummary[authorName]) {
                worklogSummary[authorName] = {
                  user: authorName,
                  totalHours: 0,
                  totalMinutes: 0,
                  entries: 0,
                };
              }
            }

            if (matchedUser && worklogSummary[matchedUser]) {
              worklogsForTargetUsers++;
              // Use timeSpent if available, fallback to timeSpentSeconds
              let hours = 0;
              if (worklog.timeSpent) {
                // Parse JIRA time format (e.g., "1d 4h 30m")
                hours = parseTimeSpent(worklog.timeSpent);
                console.log(
                  `  Time parsing: "${worklog.timeSpent}" -> ${hours} hours`
                );
              } else if (worklog.timeSpentSeconds) {
                hours = worklog.timeSpentSeconds / 3600;
                console.log(
                  `  Time from seconds: ${worklog.timeSpentSeconds}s -> ${hours} hours`
                );
              }

              // Also log what JIRA says vs what we calculated
              if (worklog.timeSpentSeconds) {
                const jiraHours = worklog.timeSpentSeconds / 3600;
                console.log(
                  `  JIRA seconds: ${worklog.timeSpentSeconds}s = ${jiraHours}h, Our parsing: ${hours}h`
                );
              }

              worklogSummary[matchedUser].totalHours += hours;
              worklogSummary[matchedUser].entries += 1;

              console.log(
                `Found worklog: ${authorName} (${matchedUser}) - ${hours.toFixed(2)}h on ${worklog.started.split("T")[0]} [${issue.key}]`
              );
            } else {
              // Only log skipped worklogs if we have specific user filters
              if (userNames.length > 0) {
                let skippedHours = 0;
                if (worklog.timeSpent) {
                  skippedHours = parseTimeSpent(worklog.timeSpent);
                } else if (worklog.timeSpentSeconds) {
                  skippedHours = worklog.timeSpentSeconds / 3600;
                }

                console.log(
                  `Skipped worklog: ${authorName} - ${skippedHours.toFixed(2)}h on ${worklog.started.split("T")[0]} [${issue.key}] (not in target users: [${userNames.join(", ")}])`
                );
              }
            }
          }
        }
      }
    }

    console.log(`📊 Worklog processing summary:`);
    console.log(`   - Total worklogs processed: ${totalWorklogsProcessed}`);
    console.log(`   - Worklogs in date range: ${worklogsInDateRange}`);
    console.log(`   - Worklogs for target users: ${worklogsForTargetUsers}`);

    // Round total hours to 2 decimal places
    Object.values(worklogSummary).forEach((summary) => {
      summary.totalHours = Math.round(summary.totalHours * 100) / 100;
      summary.totalMinutes = 0; // We're now using decimal hours instead of separate minutes
    });

    const results = Object.values(worklogSummary);
    console.log(
      `📈 Final results: ${results.map((r) => `${r.user}: ${r.totalHours}h (${r.entries} entries)`).join(", ")}`
    );

    return results;
  } catch (error) {
    console.error("Error calculating worklog hours:", error);
    throw error;
  }
}

export async function calculateStoryPoints(
  jql: string,
  assigneeNames: string[] = [],
  sprintName?: string
): Promise<StoryPointsSummary[]> {
  try {
    console.log(`🔍 Calculating story points with JQL: ${jql}`);
    
    if (assigneeNames.length > 0) {
      console.log(`👥 Target assignees: [${assigneeNames.join(", ")}]`);
    } else {
      console.log(`👥 Target assignees: All assignees (no filter)`);
    }

    if (sprintName) {
      console.log(`🎯 Sprint: ${sprintName}`);
    }

    const jiraClient = createJiraClient();
    const isDemo = JSON.parse(process.env.IS_DEMO || "false") as boolean;

    let response: any;
    if (isDemo) {
      // Read data from local JSON file for demo purposes
      const issuesDataPath = path.join(
        __dirname,
        "../../../../jiraIssues_processed.json"
      );
      
      if (fs.existsSync(issuesDataPath)) {
        const issuesData = JSON.parse(fs.readFileSync(issuesDataPath, "utf8"));
        // Filter the demo data based on JQL-like criteria
        const filteredData = getFilteredJiraIssues(issuesData, jql);
        response = { data: filteredData };
      } else {
        // Fallback to empty response if no demo data
        response = { data: { issues: [], total: 0, maxResults: 0, startAt: 0 } };
      }
    } else {
      // First, let's get ALL fields to discover which one contains story points
      response = await jiraClient.get(`/rest/api/3/search/jql`, {
        params: {
          jql,
          maxResults: 1000,
          fields: "*all", // Get all fields so we can find where story points are stored
        },
      });
    }

    if (!response.data.issues || !Array.isArray(response.data.issues)) {
      console.warn("No issues found in story points response data");
      return [];
    }

    console.log(`📋 Found ${response.data.issues.length} issues from JQL query`);

    // Log field information from the first issue for debugging
    if (response.data.issues.length > 0) {
      const firstIssue = response.data.issues[0];
      console.log(`🔍 First issue field debugging: ${firstIssue.key}`);
      
      // Check ALL customfields for potential story points (numbers > 0)
      const potentialStoryPointsFields: string[] = [];
      Object.keys(firstIssue.fields).forEach(fieldKey => {
        const fieldValue = firstIssue.fields[fieldKey];
        if (fieldKey.startsWith('customfield_') && 
            fieldValue != null && 
            typeof fieldValue === 'number' && 
            fieldValue > 0) {
          potentialStoryPointsFields.push(fieldKey);
          console.log(`🎯 POTENTIAL STORY POINTS FIELD: ${fieldKey} = ${fieldValue}`);
        }
      });
      
      // Also check for actual JIRA issue to verify the correct story points values
      console.log(`🔍 Examining ${firstIssue.key} - Please verify story points in JIRA UI`);
      
      if (potentialStoryPointsFields.length === 0) {
        console.log("❌ No numeric customfields with values > 0 found");
        console.log("Available customfields:", Object.keys(firstIssue.fields).filter(k => k.startsWith('customfield_')));
        
        // Log all field types for debugging
        Object.keys(firstIssue.fields).forEach(fieldKey => {
          if (fieldKey.startsWith('customfield_')) {
            console.log(`  - ${fieldKey}: ${firstIssue.fields[fieldKey]} (${typeof firstIssue.fields[fieldKey]})`);
          }
        });
      }
    }

    const storyPointsSummary: { [key: string]: StoryPointsSummary } = {};

    // Initialize summary for each assignee (if specific assignees are provided)
    if (assigneeNames.length > 0) {
      assigneeNames.forEach((assigneeName) => {
        storyPointsSummary[assigneeName] = {
          assignee: assigneeName,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          inProgressStoryPoints: 0,
          todoStoryPoints: 0,
          issueCount: 0,
          issues: [],
        };
      });
    }

    let totalIssuesProcessed = 0;
    let issuesWithStoryPoints = 0;

    // Process each issue
    for (const issue of response.data.issues) {
      totalIssuesProcessed++;
      
      const assigneeName = issue.fields.assignee?.displayName || "Unassigned";
      const statusName = issue.fields.status?.name || "Unknown";
      
      // Enhanced story points field detection with prioritized field order
      let storyPoints = 0;
      let storyPointsFieldFound = '';
      
      // Prioritize customfield_10130 first based on user validation that it contains correct values
      const prioritizedFields = [
        'customfield_10130',    // Preferred field with correct values
        'customfield_10036',    // Secondary fields as fallback
        'customfield_10037',
        'Story Points',         // Standard field names
        'customfield_10016',    // Most common story points field
        'customfield_10024',
        'customfield_10020',    // Another common one
        'storyPoints',
        'story_points',
        'points'
      ];
      
      // Check prioritized fields first
      for (const fieldName of prioritizedFields) {
        const fieldValue = issue.fields[fieldName];
        if (fieldValue != null && !isNaN(Number(fieldValue)) && Number(fieldValue) > 0) {
          storyPoints = Number(fieldValue);
          storyPointsFieldFound = fieldName;
          if (fieldName === 'customfield_10130') {
            console.log(`✅ Using PREFERRED story points field '${fieldName}': ${storyPoints} for issue ${issue.key}`);
          } else {
            console.log(`⚠️ Using fallback story points field '${fieldName}': ${storyPoints} for issue ${issue.key}`);
          }
          break;
        }
      }
      
      // If still no story points found, log all numeric custom fields for debugging
      if (storyPoints === 0) {
        const allNumericFields: {[key: string]: number} = {};
        Object.keys(issue.fields).forEach(fieldKey => {
          const fieldValue = issue.fields[fieldKey];
          if (fieldKey.startsWith('customfield_') && 
              fieldValue != null && 
              typeof fieldValue === 'number' && 
              fieldValue > 0) {
            allNumericFields[fieldKey] = fieldValue;
          }
        });
        
        if (Object.keys(allNumericFields).length > 0) {
          console.log(`❌ No story points found for ${issue.key} in prioritized fields`);
          console.log(`   Available numeric fields:`, allNumericFields);
          console.log(`   Consider adding missing fields to prioritized list`);
        } else {
          console.log(`❌ No story points found for ${issue.key} - no numeric custom fields available`);
        }
      }

      console.log(`Processing issue ${issue.key}: assignee="${assigneeName}", status="${statusName}", storyPoints=${storyPoints}`);

      // Process ALL matching issues, not just those with story points
      // Check if assignee matches any of our target assignees (if filter is provided)
      let matchedAssignee = null;
      if (assigneeNames.length > 0) {
        matchedAssignee = assigneeNames.find(
          (targetName) =>
            assigneeName.toLowerCase().includes(targetName.toLowerCase()) ||
            targetName.toLowerCase().includes(assigneeName.toLowerCase())
        );
      } else {
        // No assignee filter - include all assignees
        matchedAssignee = assigneeName;
        // Initialize assignee in summary if not exists
        if (!storyPointsSummary[assigneeName]) {
          storyPointsSummary[assigneeName] = {
            assignee: assigneeName,
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            inProgressStoryPoints: 0,
            todoStoryPoints: 0,
            issueCount: 0,
            issues: [],
          };
        }
      }

      if (matchedAssignee && storyPointsSummary[matchedAssignee]) {
        if (storyPoints > 0) {
          issuesWithStoryPoints++;
        }
        
        // Add to totals (even if story points is 0)
        storyPointsSummary[matchedAssignee].totalStoryPoints += storyPoints;
        storyPointsSummary[matchedAssignee].issueCount += 1;
        
        // Categorize by status - improved logic for "NEW" status
        const status = statusName.toLowerCase();
        if (status.includes('done') || status.includes('closed') || status.includes('resolved')) {
          storyPointsSummary[matchedAssignee].completedStoryPoints += storyPoints;
        } else if (status.includes('progress') || status.includes('review') || status.includes('development')) {
          storyPointsSummary[matchedAssignee].inProgressStoryPoints += storyPoints;
        } else {
          // All other statuses including "NEW", "TO DO", "OPEN", "BLOCKED", etc. go to todoStoryPoints
          storyPointsSummary[matchedAssignee].todoStoryPoints += storyPoints;
        }

        // Add issue details
        storyPointsSummary[matchedAssignee].issues.push({
          key: issue.key,
          summary: issue.fields.summary || "No summary",
          storyPoints: storyPoints,
          status: statusName,
        });

        console.log(
          `Matched issue: ${assigneeName} (${matchedAssignee}) - ${storyPoints} points for ${issue.key} [${statusName}]`
        );
      } else if (assigneeNames.length > 0) {
        console.log(
          `Skipped issue: ${assigneeName} - ${storyPoints} points for ${issue.key} (not in target assignees: [${assigneeNames.join(", ")}])`
        );
      }
    }

    console.log(`📊 Story points processing summary:`);
    console.log(`   - Total issues processed: ${totalIssuesProcessed}`);
    console.log(`   - Issues with story points: ${issuesWithStoryPoints}`);

    const results = Object.values(storyPointsSummary);
    console.log(
      `📈 Final results: ${results.map((r) => `${r.assignee}: ${r.totalStoryPoints} points (${r.issueCount} issues)`).join(", ")}`
    );

    return results;
  } catch (error) {
    console.error("Error calculating story points:", error);
    throw error;
  }
}
