# JIRA AI Assistant - Backend API

A powerful backend service that converts natural language queries into JQL (JIRA Query Language) queries and provides AI-powered insights for JIRA issue management.

## 🚀 Features

- **Natural Language to JQL Conversion**: Convert plain English queries into valid JQL using Google's Gemini AI
- **JIRA API Integration**: Fetch issues directly from your JIRA instance
- **AI Chat Assistant**: Get intelligent responses about JIRA workflows, best practices, and issue analysis
- **Issue Analysis**: AI-powered insights and pattern analysis for search results
- **Secure & Scalable**: Built with security middleware, rate limiting, and error handling

## 📋 Prerequisites

- Node.js 16+ and npm
- JIRA Cloud instance with API access
- Google AI API key (for Gemini)
- JIRA API token

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp config.example.env .env
```

Edit `.env` with your configuration:

```env
# JIRA Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your-jira-api-token

# Google AI Configuration
GOOGLE_API_KEY=your-google-ai-api-key

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Get JIRA API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "JIRA AI Assistant")
4. Copy the generated token to your `.env` file

### 4. Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

### 5. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Search Issues - `POST /query`

Convert natural language to JQL and fetch matching issues.

**Request:**
```json
{
  "query": "Show me all high priority bugs assigned to john",
  "includeAnalysis": true
}
```

**Response:**
```json
{
  "jql": "priority = High AND type = Bug AND assignee = \"john\"",
  "jqlExplanation": "This query searches for...",
  "issues": [...],
  "total": 15,
  "analysis": "Based on the search results...",
  "metadata": {
    "processingTimeMs": 1234,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### AI Chat - `POST /ai/query`

Get AI-powered assistance for JIRA-related questions.

**Request:**
```json
{
  "prompt": "How do I create a JQL query to find issues created last week?",
  "context": {...}
}
```

**Response:**
```json
{
  "response": "To find issues created last week, you can use...",
  "metadata": {
    "processingTimeMs": 800,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Health Check - `GET /health`

Check if the API is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00Z",
  "service": "JIRA AI Assistant API"
}
```

## 🧪 Example Natural Language Queries

The AI can understand and convert various types of queries:

- **Basic searches**: "Find all bugs"
- **Assignee queries**: "Issues assigned to john.doe"
- **Status filtering**: "Show me all open tickets"
- **Priority filtering**: "High priority issues"
- **Date ranges**: "Issues created this week"
- **Complex queries**: "High priority bugs in project ABC assigned to john created last month"
- **Combined criteria**: "Open issues with high priority that are overdue"

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JIRA_BASE_URL` | Yes | Your JIRA instance URL |
| `JIRA_EMAIL` | Yes | Your JIRA account email |
| `JIRA_API_TOKEN` | Yes | JIRA API token |
| `GOOGLE_API_KEY` | Yes | Google AI API key |
| `PORT` | No | Server port (default: 3001) |
| `FRONTEND_URL` | No | Frontend URL for CORS |
| `NODE_ENV` | No | Environment (development/production) |

### Rate Limiting

The API includes rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## 🏗️ Architecture

```
src/
├── config/           # Configuration and environment validation
├── llm/             # AI/LLM related services
│   └── generateJQL.ts
├── services/        # Business logic services
│   ├── jiraService.ts
│   └── aiService.ts
├── routes/          # Express route handlers
│   ├── ai.ts
│   └── jira.ts
└── index.ts         # Main server file
```

## 🔐 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configured for frontend origin
- **Input Validation**: Validate all inputs
- **Error Handling**: Secure error messages

## 🚨 Troubleshooting

### Common Issues

1. **JIRA Connection Failed**
   - Verify your JIRA URL is correct
   - Check that your API token is valid
   - Ensure your email has access to the JIRA instance

2. **AI Generation Errors**
   - Verify your Google AI API key is correct
   - Check API quotas and limits
   - Review the API key permissions

3. **CORS Errors**
   - Update `FRONTEND_URL` in your environment
   - Check that the frontend is running on the correct port

### Debug Mode

Set `NODE_ENV=development` for detailed logging:
```bash
NODE_ENV=development npm run dev
```

## 📊 Monitoring

The API provides detailed logging and metrics:
- Request processing times
- Error tracking
- JQL generation success rates
- JIRA API response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or need help:
1. Check the troubleshooting section above
2. Review the server logs for error details
3. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details