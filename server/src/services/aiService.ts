import { GoogleGenerativeAI } from '@google/generative-ai';
import { trackAICall } from '../utils/tokenTracker';

// Initialize Google AI lazily to ensure environment variables are loaded
// function getGoogleAI() {
//   const apiKey = process.env.GOOGLE_API_KEY;
//   
//   if (!apiKey) {
//     console.warn('❌ Google AI API key not found in environment variables');
//     return null;
//   }
//   
//   try {
//     const genAI = new GoogleGenerativeAI(apiKey);
//     return genAI;
//   } catch (error) {
//     console.error('❌ Failed to initialize Google AI:', error);
//     return null;
//   }
// }

// Use shared utility
import { getGoogleAI as sharedGetGoogleAI } from '../utils/googleAI';
const getGoogleAI = sharedGetGoogleAI;

export async function generateResponse(prompt: string, context: any = null) {
  try {
    console.log(`Generating AI response for prompt: "${prompt}"`);

    // Optimized system prompt for token efficiency
    const systemPrompt = `JIRA AI Assistant. Help with JQL, issues, workflows. Be concise, helpful.`;

    let enhancedPrompt = `${systemPrompt}\n\nQuery: ${prompt}`;

    if (context) {
      // Limit context size to reduce tokens
      const limitedContext = Array.isArray(context) ? context.slice(0, 5) : context;
      enhancedPrompt += `\n\nData: ${JSON.stringify(limitedContext)}`;
      enhancedPrompt += `\n\nAnalyze and respond.`;
    }

    // Generate response with Google Generative AI
    const genAI = getGoogleAI();
    if (!genAI) {
      return generateFallbackResponse(prompt, context);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();

    // Track token usage
    trackAICall(enhancedPrompt, response);

    console.log('AI response generated successfully');
    return response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback response
    return generateFallbackResponse(prompt, context);
  }
}

function generateFallbackResponse(prompt: string, context: any = null): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('jql') || lowerPrompt.includes('query')) {
    return `I can help you with JQL queries! Here are some examples:

• Find all bugs: type = Bug
• High priority issues: priority = High
• Issues assigned to someone: assignee = "username"
• Open issues: status != Done
• Issues created this week: created >= -1w
• Combine conditions: type = Bug AND priority = High AND status = "Open"

Would you like help with a specific JQL query?`;
  }
  
  if (lowerPrompt.includes('status') || lowerPrompt.includes('workflow')) {
    return `JIRA workflows typically include these statuses:
• To Do / Open - New issues waiting to be worked on
• In Progress - Issues currently being worked on
• In Review - Issues waiting for review
• Done / Closed - Completed issues

You can filter by status using: status = "Status Name"`;
  }
  
  if (lowerPrompt.includes('priority')) {
    return `JIRA priority levels are typically:
• Highest/Critical - Urgent issues requiring immediate attention
• High - Important issues to be addressed soon
• Medium - Standard priority issues
• Low - Nice-to-have improvements
• Lowest - Future considerations

Filter by priority: priority = High`;
  }
  
  if (context && Array.isArray(context)) {
    return `I found ${context.length} issues based on your search. While I can't provide AI analysis due to API limitations, you can review the results to identify patterns in status, priority, and assignments.`;
  }
  
  return `I'm currently running in limited mode due to AI API configuration issues. However, I can still help you with:

• JIRA search and filtering
• Basic JQL query guidance  
• Issue management best practices
• Understanding JIRA workflows

What specific aspect of JIRA would you like help with?`;
}

export async function generateJQLExplanation(jql: string, userQuery: string): Promise<string> {
  const genAI = getGoogleAI();
  if (!genAI) {
    return `JQL Query: ${jql}

This query was generated from your request: "${userQuery}"

Basic JQL explanation:
• ~ means "contains text"
• = means "equals exactly"
• AND combines conditions
• OR provides alternatives

The query will search for JIRA issues matching your criteria.`;
  }
  
  try {
    const prompt = `Explain JQL: ${jql}
From query: "${userQuery}"
Brief explanation:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating JQL explanation:', error);
    return `This JQL query (${jql}) was generated from your request: "${userQuery}". It will search for JIRA issues matching your criteria.`;
  }
}

export async function analyzeStoryPoints(storyPointsSummary: any[], userQuery: string): Promise<string> {
  const genAI = getGoogleAI();
  if (!genAI) {
    const totalPoints = storyPointsSummary.reduce((sum, s) => sum + s.totalStoryPoints, 0);
    const completedPoints = storyPointsSummary.reduce((sum, s) => sum + s.completedStoryPoints, 0);
    const completionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return `Story Points Analysis for "${userQuery}":

📊 Summary:
• Total Story Points: ${totalPoints}
• Completed Points: ${completedPoints}
• Completion Rate: ${completionRate}%

👥 Assignee Breakdown:
${storyPointsSummary.map(summary => 
  `• ${summary.assignee}: ${summary.totalStoryPoints} points total (${summary.completedStoryPoints} completed, ${summary.inProgressStoryPoints} in progress, ${summary.todoStoryPoints} to do)`
).join('\n')}

🎯 Top Contributors:
${storyPointsSummary
  .sort((a, b) => b.totalStoryPoints - a.totalStoryPoints)
  .slice(0, 3)
  .map((summary, index) => 
    `${index + 1}. ${summary.assignee}: ${summary.totalStoryPoints} points`
  ).join('\n')}

💡 The team has ${totalPoints} story points across ${storyPointsSummary.length} assignees with a ${completionRate}% completion rate.`;
  }
  
  try {
    const prompt = `
Analyze story points data and provide insights:

User Query: "${userQuery}"
Total Assignees: ${storyPointsSummary.length}
Total Story Points: ${storyPointsSummary.reduce((sum, s) => sum + s.totalStoryPoints, 0)}

Assignee Summary:
${storyPointsSummary.map(summary => `
- ${summary.assignee}: ${summary.totalStoryPoints} total points
  • Completed: ${summary.completedStoryPoints} points
  • In Progress: ${summary.inProgressStoryPoints} points  
  • To Do: ${summary.todoStoryPoints} points
  • Issues: ${summary.issueCount}
`).join('')}

Please provide:
1. Overall sprint/project analysis
2. Individual assignee performance insights
3. Workload distribution assessment
4. Completion rate analysis
5. Recommendations for sprint planning or capacity management

Keep the analysis actionable and insightful.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error analyzing story points:', error);
    const totalPoints = storyPointsSummary.reduce((sum, s) => sum + s.totalStoryPoints, 0);
    return `Story points analysis shows ${totalPoints} points across ${storyPointsSummary.length} assignees for "${userQuery}".`;
  }
}

export async function analyzeIssues(issues: any[], userQuery: string): Promise<string> {
  const genAI = getGoogleAI();
  if (!genAI) {
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    
    issues.forEach(issue => {
      const status = issue.fields.status?.name || 'Unknown';
      const priority = issue.fields.priority?.name || 'Not set';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });

    return `Analysis for "${userQuery}":

📊 Found ${issues.length} issues

📈 Status Distribution:
${Object.entries(statusCounts).map(([status, count]) => `• ${status}: ${count}`).join('\n')}

🎯 Priority Distribution:
${Object.entries(priorityCounts).map(([priority, count]) => `• ${priority}: ${count}`).join('\n')}

💡 You can refine your search using more specific JQL queries or filters.`;
  }
  
  try {
    const prompt = `
Analyze these JIRA issues and provide insights:

User Query: "${userQuery}"
Number of issues found: ${issues.length}

Issues summary:
${issues.slice(0, 10).map(issue => `
- ${issue.key}: ${issue.fields.summary}
  Status: ${issue.fields.status?.name || 'Unknown'}
  Priority: ${issue.fields.priority?.name || 'Not set'}
  Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}
`).join('')}

${issues.length > 10 ? `... and ${issues.length - 10} more issues` : ''}

Please provide:
1. A summary of the search results
2. Key patterns or insights from the data
3. Status distribution
4. Priority analysis
5. Any recommendations or next steps

Keep the analysis concise but insightful.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error analyzing issues:', error);
    return `Found ${issues.length} issues matching your query "${userQuery}". The search includes various statuses and priorities. Review the results for more details.`;
  }
}
