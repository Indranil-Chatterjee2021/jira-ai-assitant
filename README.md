# JIRA AI RAG

A JIRA integration with AI capabilities using Retrieval-Augmented Generation (RAG) for enhanced responses and context-aware interaction.

## Project Structure

```
jira-ai-rag/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── index.tsx
├── server/               # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── llm/
│   │   ├── tests/
│   │   └── index.ts
├── .env
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3001
   JIRA_API_TOKEN=your_jira_api_token
   JIRA_HOST=your_jira_host
   JIRA_EMAIL=your_jira_email
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   # Start both client and server
   npm run dev
   ```

## Features

- JIRA issue management through AI assistance
- Natural language processing for JIRA issue creation and updates
- Retrieval-Augmented Generation (RAG) for context-aware AI responses
- Integration with JIRA API for real-time issue tracking

## Tech Stack

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **AI**: OpenAI, LangChain
- **JIRA Integration**: JIRA API
- **YAML**: YAML
