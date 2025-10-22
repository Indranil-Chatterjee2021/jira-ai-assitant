import { GoogleGenerativeAI } from '@google/generative-ai';
import { trackAICall } from '../utils/tokenTracker';

// Cache for storing the cached model instance
let cachedModel: any = null;
let cacheCreatedAt: number = 0;
const CACHE_EXPIRY_HOURS = 1; // Cache expires after 1 hour

// Compressed system prompt for caching
// const SYSTEM_PROMPT = `You are a JIRA JQL expert. Convert natural language to JQL. Return ONLY the JQL query, no explanation.

// CRITICAL RULES:
// 1. Multiple users: use "in (user1, user2)" not OR
// 2. Fields: assignee, status, priority, type, worklogAuthor, worklogDate, created, updated
// 3. Text search: use ~ operator for names/text
// 4. Dates: "YYYY-MM-DD" format (quoted)
// 5. Relative dates: -1w, -1d, -1M
// 6. Status: "In Progress", "Done", "To Do", "New", "Blocked", "In Review", "Ready for Release", "Cancelled"
// 7. Priority: "Highest", "High", "Medium", "Low", "Lowest", "P0", "P1", "P2", "P3", "P4", "P5"
// 8. Types: "Bug", "Task", "Story", "Epic"
// 9. DEFAULT: Add "AND sprint in openSprints()" unless sprint mentioned
// 10. Backlog: 'status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()'
// 11. Current user: 'assignee = currentUser()'
// 12. Unassigned: 'assignee is EMPTY'
// 13. Teams: '"team name" = "Team Name"' for team assignments (primary team field - field name MUST be in double quotes)
// 14. Specific sprints: 'Sprint = "SprintName"' (never use "sprint name")

// WORKLOG RULES:
// - Individual users: worklogAuthor = "username" 
// - Team IDs: Team[Team] = "teamId" or Team[Team] IN ("teamId1", "teamId2") for multiple
// - Always include worklogDate filters
// - Team IDs are long UUIDs like "42c8b803-dec0-4cd2-9915-513ed000u487-612"

// EXAMPLES:
// - "bugs for john" → assignee = "john" AND type = Bug AND sprint in openSprints()
// - "worklog by john last week" → worklogAuthor = "john" AND worklogDate >= -1w
// - "backlog issues" → status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()
// - "my tasks" → assignee = currentUser() AND type = Task AND sprint in openSprints()
// - "issues for TEST TEAM" → "team name" = "TEST TEAM" AND sprint in openSprints()
// - "backlog for TEST TEAM" → status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints() AND "team name" = "TEST TEAM"
// - "issues in sprint TEAM 25.3.5" → Sprint = "TEAM 25.3.5"
// - "backlog for sprint TEAM 25.3.5" → status IN ("New", "To Do", "Blocked") AND Sprint = "TEAM 25.3.5"
// - "worklog hours for team id 12345" → Team[Team] = "12345" AND worklogDate >= "2025-01-01" AND worklogDate <= "2025-01-31"
// - "worklog for team ids 12345 and 67890" → Team[Team] IN ("12345", "67890") AND worklogDate >= "start" AND worklogDate <= "end"`

const SYSTEM_PROMPT = `You are a JIRA JQL expert. Convert natural language to JQL. Return ONLY the JQL query, no explanation.

CRITICAL RULES:
1. Multiple users: use "in (user1, user2)" not OR
2. Fields: assignee, status, priority, type, worklogAuthor, worklogDate, created, updated, "Story Points"
3. Text search: use ~ operator for names/text
4. Dates: "YYYY-MM-DD" format (quoted)
5. Relative dates: -1w, -1d, -1M
6. Status: "In Progress", "Done", "To Do", "New", "Blocked", "In Review", "Ready for Release", "Cancelled"
7. Priority: "Highest", "High", "Medium", "Low", "Lowest", "P0", "P1", "P2", "P3", "P4", "P5"
8. Types: "Bug", "Task", "Story", "Epic"
9. DEFAULT: Add "AND sprint in openSprints()" unless sprint mentioned
10. Backlog: 'status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()'
11. Current user: 'assignee = currentUser()'
12. Unassigned: 'assignee is EMPTY'
13. Teams: '"team name" = "Team Name"' for team assignments (primary team field - field name MUST be in double quotes)
14. Specific sprints: 'Sprint = "SprintName"' (never use "sprint name")
15. NEVER add project keys unless explicitly mentioned in the query
16. Story Points: Use "Story Points" field for story point queries, filter with IS NOT EMPTY for existing values

STORY POINTS RULES:
- ALWAYS exclude completed work: AND status NOT IN ("Done", "Closed", "Resolved", "Cancelled", "Ready for Release", "Released", "Deployed", "In Review")
- For active story points: AND status IN ("To Do", "In Progress", "New", "Open", "Blocked")
- Multiple assignees: assignee IN ("user1", "user2") 
- Include sprint context when mentioned
- Filter for existing story points: AND "Story Points" is not EMPTY

WORKLOG RULES:
- Individual users: worklogAuthor = "username" 
- Team IDs: Team[Team] = "teamId" or Team[Team] IN ("teamId1", "teamId2") for multiple
- Always include COMPLETE worklogDate filters with both start AND end dates
- Team IDs are long UUIDs like "42c8b803-dec0-4cd2-9915-513ed000u487-612"
- Date ranges: worklogDate >= "YYYY-MM-DD" AND worklogDate <= "YYYY-MM-DD"

EXAMPLES:
- "bugs for john" → assignee = "john" AND type = Bug AND sprint in openSprints()
- "worklog by john last week" → worklogAuthor = "john" AND worklogDate >= -1w AND worklogDate <= now()
- "worklog for team ids 12345 and 67890 in January 2025" → Team[Team] IN ("12345", "67890") AND worklogDate >= "2025-01-01" AND worklogDate <= "2025-01-31"
- "backlog issues" → status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints()
- "my tasks" → assignee = currentUser() AND type = Task AND sprint in openSprints()
- "issues for TEST TEAM" → "team name" = "TEST TEAM" AND sprint in openSprints()
- "backlog for TEST TEAM" → status IN ("New", "To Do", "Blocked") AND Sprint not in openSprints() AND "team name" = "TEST TEAM"
- "issues in sprint TEAM 25.3.5" → Sprint = "TEAM 25.3.5"
- "backlog for sprint TEAM 25.3.5" → status IN ("New", "To Do", "Blocked") AND Sprint = "TEAM 25.3.5"
- "story points for john and mary in sprint XYZ" → assignee IN ("john", "mary") AND Sprint = "XYZ" AND "Story Points" is not EMPTY AND status NOT IN ("Done", "Closed", "Resolved", "Cancelled", "Ready for Release", "Released", "Deployed", "In Review")
- "how many story points assigned to alice" → assignee = "alice" AND "Story Points" is not EMPTY AND status NOT IN ("Done", "Closed", "Resolved", "Cancelled", "Ready for Release", "Released", "Deployed", "In Review") AND sprint in openSprints()
- "total story points for team ABC in current sprint" → "team name" = "ABC" AND "Story Points" is not EMPTY AND status NOT IN ("Done", "Closed", "Resolved", "Cancelled", "Ready for Release", "Released", "Deployed", "In Review") AND sprint in openSprints()
- "remaining story points in sprint DEF" → Sprint = "DEF" AND "Story Points" is not EMPTY AND status IN ("To Do", "In Progress", "New", "Open", "Blocked")`


// Initialize Google AI lazily to ensure environment variables are loaded
// function getGoogleAI() {
//   const apiKey = process.env.GOOGLE_API_KEY;
//   console.log('🔑 Google AI API Key check:', { 
//     exists: !!apiKey, 
//     length: apiKey?.length || 0,
//     firstChars: apiKey?.substring(0, 6) + '...' || 'none'
//   });
//   
//   if (!apiKey) {
//     console.warn('❌ Google AI API key not found in environment variables');
//     return null;
//   }
//   
//   try {
//     const genAI = new GoogleGenerativeAI(apiKey);
//     console.log('✅ Google AI initialized successfully');
//     return genAI;
//   } catch (error) {
//     console.error('❌ Failed to initialize Google AI:', error);
//     return null;
//   }
// }

// Use shared utility
import { getGoogleAI as sharedGetGoogleAI } from '../utils/googleAI';
const getGoogleAI = sharedGetGoogleAI;

// Force cache invalidation (useful when system prompt is updated)
export function invalidateCache() {
  cachedModel = null;
  cacheCreatedAt = 0;
  console.log('🗑️ Cache invalidated - next query will create fresh model with updated team worklog and sprint syntax');
}

// Get or create cached model
async function getCachedModel() {
  const now = Date.now();
  const cacheAge = (now - cacheCreatedAt) / (1000 * 60 * 60); // hours
  
  // Check if cache is expired or doesn't exist
  if (!cachedModel || cacheAge >= CACHE_EXPIRY_HOURS) {
    console.log(`🔄 ${!cachedModel ? 'Creating' : 'Refreshing'} cached model (cache age: ${cacheAge.toFixed(2)}h)`);
    
    const genAI = getGoogleAI();
    if (!genAI) {
      return null;
    }
    
    try {
      // Create a cached model with system instructions
      cachedModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: {
          role: 'system',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent JQL generation
          maxOutputTokens: 500, // JQL queries are typically short
        }
      });
      
      cacheCreatedAt = now;
      console.log('✅ Cached model created successfully with updated team field syntax');
      
      return cachedModel;
    } catch (error) {
      console.error('❌ Failed to create cached model:', error);
      // Fall back to non-cached model
      return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }
  
  console.log(`♻️ Using cached model (age: ${cacheAge.toFixed(2)}h)`);
  return cachedModel;
}

// Fallback to non-cached generation for backward compatibility
async function generateWithoutCache(userQuery: string): Promise<string> {
  console.log('🔄 Falling back to non-cached generation');
  
  const genAI = getGoogleAI();
  if (!genAI) {
    return generateFallbackJQL(userQuery);
  }
  
  const fullPrompt = `${SYSTEM_PROMPT}

Query: "${userQuery}"
JQL:`;
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(fullPrompt);
  
  return result.response.text().trim();
}

export async function generateJQL(userQuery: string): Promise<string> {
  try {
    console.log(`🤖 Generating JQL using cached LLM for: "${userQuery}"`);
    
    let jql = '';
    let inputTokens = 0;
    let outputTokens = 0;
    
    try {
      // Try to use cached model first
      const model = await getCachedModel();
      if (!model) {
        console.warn('🤖 Cached LLM not available, falling back to rule-based generation');
        return generateFallbackJQL(userQuery);
      }
      
      // With cached model, we only send the user query
      const userPrompt = `Query: "${userQuery}"
JQL:`;
      
      console.log(`📊 Token usage - Input: ~${userPrompt.length / 4} tokens (vs ~${SYSTEM_PROMPT.length / 4} without caching)`);
      
      const result = await model.generateContent(userPrompt);
      jql = result.response.text().trim();
      
      // Estimate token usage for tracking
      inputTokens = Math.ceil(userPrompt.length / 4); // Rough estimation
      outputTokens = Math.ceil(jql.length / 4);
      
      console.log(`💾 Cache hit - Saved ~${Math.ceil(SYSTEM_PROMPT.length / 4)} input tokens`);
      
    } catch (cacheError) {
      console.warn('⚠️ Cached model failed, falling back to non-cached generation:', cacheError);
      
      // Fallback to non-cached generation
      jql = await generateWithoutCache(userQuery);
      
      // Estimate full token usage for fallback
      inputTokens = Math.ceil((SYSTEM_PROMPT.length + userQuery.length + 50) / 4);
      outputTokens = Math.ceil(jql.length / 4);
    }
    
    // Track token usage (now with much lower input tokens due to caching)
    trackAICall(`Cached prompt + Query: "${userQuery}"`, jql, inputTokens, outputTokens);
    
    // Clean up the response - remove any markdown formatting or extra text
    jql = jql.replace(/```jql/g, '').replace(/```/g, '').replace(/```/g, '').trim();
    
    console.log(`🤖 Generated LLM JQL: ${jql}`);
    
    // Basic validation - ensure it looks like a JQL query
    if (!jql || jql.length < 3) {
      console.warn('Generated JQL query is too short or empty, using fallback');
      return generateFallbackJQL(userQuery);
    }
    
    // Additional validation - check for basic JQL structure
    if (!jql.match(/\w+\s*(=|~|!=|in|not in|>|<|>=|<=)\s*.+/)) {
      console.warn('Generated JQL does not match expected structure, using fallback');
      return generateFallbackJQL(userQuery);
    }
    
    // Apply default sprint filter to LLM-generated JQL as well
    const finalJql = addDefaultSprintFilter(jql, userQuery);
    console.log(`🎯 Final JQL with sprint filter: ${finalJql}`);
    
    return finalJql;
  } catch (error) {
    console.error('❌ Error generating JQL with LLM:', error);
    console.log('🔧 Falling back to rule-based generation');
    return generateFallbackJQL(userQuery);
  }
}

// Helper function to add sprint filter when no sprint is mentioned
function addDefaultSprintFilter(jql: string, userQuery: string): string {
  const query = userQuery.toLowerCase();
  
  // Don't add sprint filter if:
  // 1. Sprint is already mentioned in the query
  // 2. It's a specific issue key query (these shouldn't be limited by sprint)
  // 3. It's a worklog query (worklog queries typically span multiple sprints)
  // 4. Query explicitly mentions "all sprints" or "any sprint"
  // 5. Sprint filter already exists in the JQL
  // 6. JQL already contains Sprint not in openSprints() (backlog queries)
  if (query.includes('sprint') || 
      query.includes('worklog') || 
      query.includes('hours') || 
      query.includes('time spent') ||
      query.includes('all sprint') ||
      query.includes('any sprint') ||
      userQuery.match(/[A-Z]+-\d+/gi) ||
      jql.toLowerCase().includes('sprint in opensprints()') ||
      jql.toLowerCase().includes('sprint not in opensprints()') ||
      jql.toLowerCase().includes('sprint is empty')) {
    return jql;
  }
  
  // Add sprint filter to existing JQL
  if (jql.includes('ORDER BY')) {
    return jql.replace(/\s+ORDER BY/, ' AND sprint in openSprints() ORDER BY');
  } else {
    return `${jql} AND sprint in openSprints()`;
  }
}

function generateFallbackJQL(userQuery: string): string {
  const query = userQuery.toLowerCase().trim();
  
  console.log(`🤖 Using fallback JQL generation for: "${userQuery}"`);
  
  // Check for specific issue keys (e.g., MSC-137637, MSC-135727) in the original query (case-insensitive)
  const issueKeyMatch = userQuery.match(/([A-Z]+-\d+)/gi);
  if (issueKeyMatch) {
    console.log(`📝 Detected issue keys: ${issueKeyMatch.join(', ')}`);
    if (issueKeyMatch.length === 1) {
      return `key = "${issueKeyMatch[0].toUpperCase()}"`;
    } else {
      const keyList = issueKeyMatch.map(key => `"${key.toUpperCase()}"`).join(', ');
      return `key in (${keyList})`;
    }
  }
  
  // Enhanced pattern matching for common queries
  if (query.includes('bug') || query.includes('bugs')) {
    const jql = `type = Bug AND (summary ~ "${userQuery}" OR description ~ "${userQuery}") ORDER BY updated DESC`;
    return addDefaultSprintFilter(jql, userQuery);
  }
  
  if (query.includes('high priority')) {
    const jql = `priority = High AND (summary ~ "${userQuery}" OR description ~ "${userQuery}") ORDER BY updated DESC`;
    return addDefaultSprintFilter(jql, userQuery);
  }
  
  if (query.includes('open') || query.includes('todo')) {
    const jql = `status != Done AND (summary ~ "${userQuery}" OR description ~ "${userQuery}") ORDER BY updated DESC`;
    return addDefaultSprintFilter(jql, userQuery);
  }
  
  // Enhanced worklog pattern matching
  if (query.includes('worklog') || query.includes('hours') || query.includes('time spent')) {
    // Extract user names - handle patterns like "by User1", "for User1", "of User1"
    const worklogMatch = query.match(/(?:by|for|of)\s+(.+?)\s+between/);
    if (worklogMatch) {
      const userNamesStr = worklogMatch[1].trim();
      const userNames = userNamesStr.split(/\s+and\s+|\s*,\s*/).map(name => name.trim());
      console.log(`📝 Detected worklog users: ${userNames.join(', ')}`);
      
      // Check if there's a date range
      const dateRangeMatch = query.match(/between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/);
      if (dateRangeMatch) {
        const [, startDate, endDate] = dateRangeMatch;
        console.log(`📅 Detected worklog date range: ${startDate} to ${endDate}`);
        
        if (userNames.length === 1) {
          return `(worklogAuthor = "${userNames[0]}" AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}") OR (assignee = "${userNames[0]}" AND updated >= "${startDate}" AND updated <= "${endDate}")`;
        } else {
          const userList = userNames.map(name => `"${name}"`).join(', ');
          return `(worklogAuthor in (${userList}) AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}") OR (assignee in (${userList}) AND updated >= "${startDate}" AND updated <= "${endDate}")`;
        }
      }
      
      if (userNames.length === 1) {
        return `worklogAuthor = "${userNames[0]}" OR assignee = "${userNames[0]}"`;
      } else {
        const userList = userNames.map(name => `"${name}"`).join(', ');
        return `worklogAuthor in (${userList}) OR assignee in (${userList})`;
      }
    }
  }

  // Enhanced assignee pattern matching
  if (query.includes('assigned to') || query.includes('tickets assigned to')) {
    // Extract assignee name - handle full names with spaces
    const assigneeMatch = query.match(/assigned to ([a-zA-Z\s]+?)(?:\s+between|\s*$)/);
    if (assigneeMatch) {
      const assigneeName = assigneeMatch[1].trim();
      console.log(`📝 Detected assignee: "${assigneeName}"`);
      
      // Check if there's a date range
      const dateRangeMatch = query.match(/between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/);
      if (dateRangeMatch) {
        const [, startDate, endDate] = dateRangeMatch;
        console.log(`📅 Detected date range: ${startDate} to ${endDate}`);
        const jql = `assignee ~ "${assigneeName}" AND created >= "${startDate}" AND created <= "${endDate}" ORDER BY updated DESC`;
        return addDefaultSprintFilter(jql, userQuery);
      }
      
      const jql = `assignee ~ "${assigneeName}" ORDER BY updated DESC`;
      return addDefaultSprintFilter(jql, userQuery);
    }
  }

  // Enhanced pattern matching for story points queries
  if (query.includes('story point') || query.includes('story points') || 
      query.includes('points assigned') || query.includes('points for') ||
      query.includes('total points') || query.includes('remaining points')) {
    
    console.log('📊 Detected story points query in fallback');
    
    // Extract assignees and sprint information
    const assigneeMatches = query.match(/(?:story points?|points)\s+(?:for|assigned to|of)\s+([^,.]+(?:,\s*[^,.]+)*)/i) ||
                           query.match(/assigned to\s+([^,.]+(?:,\s*[^,.]+)*)/i) ||
                           query.match(/(?:story points?|points)\s+(?:for|of|assigned to)\s+(.+?)(?:\s+(?:for|in)\s+sprint|\s*$)/i);
    
    const sprintMatch = query.match(/(?:for|in)\s+(?:the\s+)?sprint\s+([a-zA-Z0-9.\s-]+)/i);
    
    if (assigneeMatches) {
      const assigneeStr = assigneeMatches[1].trim();
      // Split by "and" or comma to get multiple assignees
      const assignees = assigneeStr.split(/\s+and\s+|\s*,\s*/).map(name => name.trim()).filter(name => name.length > 0);
      console.log(`📊 Detected story points query for assignees: ${assignees.join(', ')}`);
      
      let jql = '';
      if (assignees.length === 1) {
        jql = `assignee ~ "${assignees[0]}"`;
      } else {
        const assigneeList = assignees.map(name => `"${name}"`).join(', ');
        jql = `assignee in (${assigneeList})`;
      }
      
      // Add sprint filter if specified
      if (sprintMatch) {
        const sprintName = sprintMatch[1].trim();
        console.log(`📅 Detected sprint: ${sprintName}`);
        jql += ` AND Sprint = "${sprintName}"`;
      }
      
      // Add story points filter
      jql += ` AND "Story Points" is not EMPTY`;
      
      // Add comprehensive status filter to exclude completed work
      jql += ` AND status NOT IN ("Done", "Closed", "Resolved", "Cancelled", "Ready for Release", "Released", "Deployed", "In Review")`;
      
      // Add default sprint filter if no specific sprint mentioned
      if (!sprintMatch) {
        jql += ' AND sprint in openSprints()';
      }
      
      jql += ' ORDER BY assignee, "Story Points" DESC';
      console.log(`📊 Generated enhanced story points JQL: ${jql}`);
      return jql;
    }
  }

  // Enhanced pattern matching for "issues for [user]" queries
  if (query.includes('issues for') || query.includes('tickets for')) {
    // Extract user name - handle full names with spaces
    const userMatch = query.match(/(?:issues|tickets) for ([a-zA-Z\s]+?)(?:\s+between|\s*$)/);
    if (userMatch) {
      const userName = userMatch[1].trim();
      console.log(`📝 Detected user for issues: "${userName}"`);
      
      // Check if there's a date range
      const dateRangeMatch = query.match(/between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/);
      if (dateRangeMatch) {
        const [, startDate, endDate] = dateRangeMatch;
        console.log(`📅 Detected date range: ${startDate} to ${endDate}`);
        const jql = `assignee ~ "${userName}" AND created >= "${startDate}" AND created <= "${endDate}" ORDER BY updated DESC`;
        return addDefaultSprintFilter(jql, userQuery);
      }
      
      const jql = `assignee ~ "${userName}" ORDER BY updated DESC`;
      return addDefaultSprintFilter(jql, userQuery);
    }
  }
  
  // Check for date ranges in general
  const dateRangeMatch = query.match(/between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/);
  if (dateRangeMatch) {
    const [, startDate, endDate] = dateRangeMatch;
    console.log(`📅 Detected date range: ${startDate} to ${endDate}`);
    const jql = `created >= "${startDate}" AND created <= "${endDate}" ORDER BY updated DESC`;
    return addDefaultSprintFilter(jql, userQuery);
  }
  
  // Default fallback
  console.log(`🔍 Using generic search for: "${userQuery}"`);
  const jql = `summary ~ "${userQuery}" OR description ~ "${userQuery}" ORDER BY updated DESC`;
  return addDefaultSprintFilter(jql, userQuery);
}
