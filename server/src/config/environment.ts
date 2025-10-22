import dotenv from 'dotenv';

dotenv.config();

interface Config {
  // Server Configuration
  port: number;
  nodeEnv: string;
  frontendUrl: string;

  // JIRA Configuration
  jira: {
    baseUrl: string;
    email: string;
    apiToken: string;
  };

  // AI Configuration
  ai: {
    googleApiKey?: string | undefined;
    openAiApiKey?: string | undefined;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging
  logLevel: string;
}

function validateEnvironment(): Config {
  const requiredVars = [
    'JIRA_BASE_URL',
    'JIRA_EMAIL',
    'JIRA_API_TOKEN',
    'GOOGLE_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please copy config.example.env to .env and fill in the required values.');
    process.exit(1);
  }

  // Validate JIRA URL format
  const jiraUrl = process.env.JIRA_BASE_URL!;
  if (!jiraUrl.startsWith('https://') || !jiraUrl.includes('.atlassian.net')) {
    console.error('❌ JIRA_BASE_URL must be a valid Atlassian URL (e.g., https://your-domain.atlassian.net)');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.JIRA_EMAIL!)) {
    console.error('❌ JIRA_EMAIL must be a valid email address');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated successfully');

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    jira: {
      baseUrl: process.env.JIRA_BASE_URL!,
      email: process.env.JIRA_EMAIL!,
      apiToken: process.env.JIRA_API_TOKEN!,
    },

    ai: {
      googleApiKey: process.env.GOOGLE_API_KEY,
      openAiApiKey: process.env.OPENAI_API_KEY,
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

export const config = validateEnvironment();

export default config;