import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateJQL, invalidateCache } from './llm/generateJql';
import { fetchJiraIssues, calculateWorklogHours, calculateStoryPoints, WorklogSummary } from './services/jiraService';
import { generateResponse, generateJQLExplanation, analyzeIssues } from './services/aiService';
import { getTokenStats } from './utils/tokenTracker';

import jiraRoutes from './routes/jira';

dotenv.config();

// Invalidate LLM cache on startup to ensure fresh model with latest prompt changes
invalidateCache();

// Environment variables loaded via dotenv.config()

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res): Promise<void> => {
  try {
    // Check JIRA connection
    let jiraStatus = 'disconnected';
    try {
      // Lightweight connection test - just check if we have valid config
      const jiraBaseUrl = process.env.JIRA_BASE_URL;
      const jiraEmail = process.env.JIRA_EMAIL;
      const jiraApiToken = process.env.JIRA_API_TOKEN;
      
      if (jiraBaseUrl && jiraEmail && jiraApiToken) {
        // Test with a minimal API call to JIRA myself endpoint (doesn't create logs)
        const axios = require('axios');
        const response = await axios.get(`${jiraBaseUrl}/rest/api/3/myself`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 5000
        });
        
        if (response.status === 200) {
          jiraStatus = 'connected';
        }
      }
    } catch (jiraError) {
      // Silent fail for health check
      jiraStatus = 'disconnected';
    }

    // Check Google AI connection
    let aiStatus = 'disconnected';
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey && apiKey.length > 10) {
        aiStatus = 'connected';
      }
    } catch (aiError) {
      console.log('AI connection test failed:', aiError);
    }

    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'JIRA AI Assistant API',
      connections: {
        jira: jiraStatus,
        ai: aiStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Token statistics endpoint
app.get('/stats/tokens', (req, res) => {
  try {
    const stats = getTokenStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ error: 'Failed to fetch token statistics' });
  }
});

// Enhanced search endpoint
app.post('/query', async (req, res): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { query, includeAnalysis = false } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ 
        error: 'Query parameter is required and must be a non-empty string' 
      });
      return;
    }


    // Step 1: Generate JQL from natural language
    const jql = await generateJQL(query);
    console.log(`Generated JQL: ${jql}`);

    // Check if this is a worklog hours query
    const isWorklogQuery = query.toLowerCase().includes('worklog') || 
                          query.toLowerCase().includes('hours') || 
                          query.toLowerCase().includes('time spent');
    
    // Check if this is a story points query
    const isStoryPointsQuery = query.toLowerCase().includes('story point') || 
                              query.toLowerCase().includes('story points') || 
                              jql.toLowerCase().includes('"story points" is not empty');
    
    let worklogSummary: WorklogSummary[] | null = null;
    let storyPointsSummary: any[] | null = null;
    let startDate: string = '';
    let endDate: string = '';

    if (isWorklogQuery) {
      console.log(`🕐 Detected worklog query, calculating hours...`);
      
      // Extract user names and date range from both query text and generated JQL
      const userMatches = query.match(/(?:by|for|of)\s+(.+?)\s+(?:between|for the period|from)/);
      // Support multiple date formats: "between X and Y", "for the period of X to Y", "from X to Y"
      const dateMatches = query.match(/(?:between|period of|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to)\s+(\d{4}-\d{2}-\d{2})/);
      
      // Also try to extract from JQL as backup
      const jqlUserMatches = jql.match(/worklogAuthor\s*=\s*"([^"]+)"|worklogAuthor\s*in\s*\(([^)]+)\)/);
      const jqlDateMatches = jql.match(/worklogDate\s*>=\s*"([^"]+)".*worklogDate\s*<=\s*"([^"]+)"/);
      
      let userNames: string[] = [];
      
      // Extract dates - prefer from JQL (more reliable), fallback to query text
      if (jqlDateMatches) {
        // Extract from JQL first (most reliable)
        startDate = jqlDateMatches[1];
        endDate = jqlDateMatches[2];
        console.log(`📅 Extracted dates from JQL: ${startDate} to ${endDate}`);
        
        // Try to extract users from JQL
        if (jqlUserMatches) {
          if (jqlUserMatches[1]) {
            userNames = [jqlUserMatches[1]];
          } else if (jqlUserMatches[2]) {
            userNames = jqlUserMatches[2].split(',').map(u => u.trim().replace(/"/g, ''));
          }
          console.log(`👥 Extracted users from JQL: [${userNames.join(', ')}]`);
        } else {
          console.log(`📋 Team-based or project query - no individual user filtering, using date range only`);
        }
      } else if (userMatches && dateMatches) {
        // Fallback to query text extraction
        const userNamesStr = userMatches[1].trim();
        
        // Check if this looks like a team query (contains "team" keyword)
        if (userNamesStr.toLowerCase().includes('team')) {
          console.log(`📋 Detected team query from text, skipping individual user extraction`);
          userNames = []; // Don't extract team names as individual users
        } else {
          userNames = userNamesStr.split(/\s+and\s+|\s*,\s*/).map(name => name.trim());
          console.log(`👥 Extracted users from query text: [${userNames.join(', ')}]`);
        }
        startDate = dateMatches[1];
        endDate = dateMatches[2];
        console.log(`📅 Extracted dates from query text: ${startDate} to ${endDate}`);
      } else {
        // For queries like "How many worklogs exist for MSC-135727", show all worklogs without filtering
        console.log(`📋 Worklog query without specific user/date filters - will show all worklogs from fetched issues`);
      }
      
      // Process worklog calculation if we have filters OR if it's a general worklog query
      // Cases: 1) Individual users with dates, 2) Team query with dates, 3) General query without filters
      if ((userNames.length > 0 && startDate && endDate) || 
          (userNames.length === 0 && startDate && endDate) || 
          (userNames.length === 0 && !startDate && !endDate)) {
        
        if (userNames.length > 0) {
          console.log(`👥 Users: ${userNames.join(', ')}`);
        } else {
          console.log(`👥 Users: All users`);
        }
        
        if (startDate && endDate) {
          console.log(`📅 Date range: ${startDate} to ${endDate}`);
        } else {
          console.log(`📅 Date range: All dates`);
        }
        
        try {
          worklogSummary = await calculateWorklogHours(jql, userNames, startDate, endDate);
          console.log(`✅ Worklog calculation completed. Found data for ${worklogSummary.length} users.`);
          if (worklogSummary.length > 0) {
            const totalHours = worklogSummary.reduce((total, summary) => total + summary.totalHours, 0);
            console.log(`📊 Total hours found: ${totalHours.toFixed(2)}`);
          }
        } catch (worklogError) {
          console.error('❌ Error calculating worklog hours:', worklogError);
          // Initialize empty worklog summary to show 0 results rather than failing completely
          worklogSummary = userNames.map(userName => ({
            user: userName,
            totalHours: 0,
            totalMinutes: 0,
            entries: 0
          }));
          console.log(`🔧 Created empty worklog summary for ${userNames.length} users as fallback`);
        }
      } else {
        console.warn(`⚠️  Could not extract user names and dates from query or JQL`);
        console.log(`   Query: "${query}"`);
        console.log(`   JQL: "${jql}"`);
      }
    }

    // Handle story points queries
    if (isStoryPointsQuery) {
      console.log(`📊 Detected story points query, calculating story points...`);
      
      // Extract assignee names from query and JQL
      let assigneeNames: string[] = [];
      
      // Try to extract from query text first with flexible pattern
      const queryAssigneeMatches = query.match(/(?:assigned to|story points?\s+(?:of|for))\s+(.+?)(?:\s+for\s+(?:the\s+)?sprint)/i);
      if (queryAssigneeMatches) {
        const assigneeStr = queryAssigneeMatches[1].trim();
        assigneeNames = assigneeStr.split(/\s*,\s*|\s+and\s+/).map(name => name.trim()).filter(name => name.length > 0);
        console.log(`👥 Extracted assignees from query: [${assigneeNames.join(', ')}]`);
      }
      
      // Also try to extract from JQL as backup
      const jqlAssigneeMatches = jql.match(/assignee\s*=\s*"([^"]+)"|assignee\s*in\s*\(([^)]+)\)/);
      if (jqlAssigneeMatches && assigneeNames.length === 0) {
        if (jqlAssigneeMatches[1]) {
          // Single assignee
          assigneeNames = [jqlAssigneeMatches[1]];
        } else if (jqlAssigneeMatches[2]) {
          // Multiple assignees
          assigneeNames = jqlAssigneeMatches[2].split(',').map(name => name.trim().replace(/"/g, ''));
        }
        console.log(`👥 Extracted assignees from JQL: [${assigneeNames.join(', ')}]`);
      }
      
      // Extract sprint name
      let sprintName: string | undefined = undefined;
      const sprintMatch = query.match(/(?:for|in)\s+sprint\s+([a-zA-Z0-9.\s]+)/i) || 
                         jql.match(/Sprint\s*=\s*"([^"]+)"/);
      if (sprintMatch) {
        sprintName = sprintMatch[1].trim();
        console.log(`🎯 Detected sprint: ${sprintName}`);
      }
      
      if (assigneeNames.length > 0 || sprintName) {
        console.log(`📊 Calculating story points...`);
        if (assigneeNames.length > 0) {
          console.log(`👥 Target assignees: [${assigneeNames.join(", ")}]`);
        } else {
          console.log(`👥 Target assignees: All assignees (no filter)`);
        }

        try {
          storyPointsSummary = await calculateStoryPoints(jql, assigneeNames, sprintName);
          console.log(`✅ Story points calculation completed. Found data for ${storyPointsSummary.length} assignees.`);
          if (storyPointsSummary.length > 0) {
            const totalPoints = storyPointsSummary.reduce((total, summary) => total + summary.totalStoryPoints, 0);
            console.log(`📊 Total story points found: ${totalPoints}`);
          }
        } catch (storyPointsError) {
          console.error('❌ Error calculating story points:', storyPointsError);
          // Initialize empty story points summary to show 0 results rather than failing completely
          storyPointsSummary = assigneeNames.map(assigneeName => ({
            assignee: assigneeName,
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            inProgressStoryPoints: 0,
            todoStoryPoints: 0,
            issueCount: 0,
            issues: []
          }));
          console.log(`🔧 Created empty story points summary for ${assigneeNames.length} assignees as fallback`);
        }
      } else {
        console.warn(`⚠️  Could not extract assignee names from query or JQL`);
        console.log(`   Query: "${query}"`);
        console.log(`   JQL: "${jql}"`);
      }
    }

    // Step 2: Fetch issues from JIRA
    // Use higher limit for worklog and story points queries to ensure we get all related issues
    // Increased regular query limit to 200 to ensure all user issues are captured
    const maxResults = (isWorklogQuery || isStoryPointsQuery) ? 1000 : 200;
    console.log(`📊 Using maxResults: ${maxResults} ${isWorklogQuery ? '(worklog query)' : isStoryPointsQuery ? '(story points query)' : '(regular query)'}`);
    
    // Determine forType for demo mode data selection
    let forType: string | undefined = undefined;
    if (process.env.IS_DEMO === 'true') {
      if (isWorklogQuery) {
        forType = 'worklog';
      } else if (isStoryPointsQuery) {
        forType = 'general'; // Story points are part of general issue data
      } else if (query.toLowerCase().includes('backlog') || jql.toLowerCase().includes('sprint not in opensprints()')) {
        forType = 'backlog';
      } else {
        forType = 'general';
      }
      console.log(`🎭 Demo mode: Using data type '${forType}' for query: "${query}"`);
    }
    
    const jiraResponse = await fetchJiraIssues(jql, maxResults, forType);
    
    // Step 3: Optionally generate AI analysis
    let analysis = null;
    let jqlExplanation = null;
    
    if (includeAnalysis && jiraResponse.issues.length > 0) {
      try {
        [analysis, jqlExplanation] = await Promise.all([
          analyzeIssues(jiraResponse.issues, query),
          generateJQLExplanation(jql, query)
        ]);
      } catch (analysisError) {
        console.error('Error generating analysis:', analysisError);
        // Continue without analysis rather than failing the whole request
      }
    }

    const processingTime = Date.now() - startTime;
    
    res.json({ 
      jql,
      jqlExplanation,
      issues: jiraResponse.issues,
      total: jiraResponse.total,
      maxResults: jiraResponse.maxResults,
      startAt: jiraResponse.startAt,
      analysis,
      worklogSummary,
      storyPointsSummary,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        query: query,
        isWorklogQuery,
        isStoryPointsQuery,
        startDate: startDate || null,
        endDate: endDate || null
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error in /query endpoint:', error);
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// AI Chat endpoint
app.post('/ai/query', async (req, res): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { prompt, context } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ 
        error: 'Prompt parameter is required and must be a non-empty string' 
      });
      return;
    }

    console.log(`Processing AI chat query: "${prompt}"`);

    const response = await generateResponse(prompt, context);
    const processingTime = Date.now() - startTime;
    
    res.json({ 
      response,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        prompt: prompt
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error in /ai/query endpoint:', error);
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Mount route modules

app.use('/api/jira', jiraRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableEndpoints: [
      'POST /query - Search JIRA issues with natural language',
      'POST /ai/query - AI chat assistance',
      'GET /health - Health check',
      'GET /api/jira/issues - Get JIRA issues',
      'POST /api/ai/generate - Generate AI responses'
    ]
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Export app for testing
export { app };

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 JIRA AI Assistant API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Token stats: http://localhost:${PORT}/stats/tokens`);
    console.log(`🔍 Search endpoint: http://localhost:${PORT}/query`);
  });
}
