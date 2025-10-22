/**
 * Generic API Helper Functions
 * Reduces code duplication across the application
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Generic HTTP client
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await axios({
        ...config,
        baseURL: this.baseURL,
        headers: { ...this.defaultHeaders, ...config.headers },
        timeout: config.timeout || 10000
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error',
        status: error.response?.status
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

// JIRA-specific HTTP client factory
export function createJiraClient(): HttpClient {
  const jiraBaseUrl = process.env.JIRA_BASE_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
    throw new Error('JIRA configuration is missing. Please check environment variables.');
  }

  return new HttpClient(jiraBaseUrl, {
    'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });
}

// Generic field extractor for JIRA responses
export function extractField<T>(obj: any, path: string, defaultValue?: T): T {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
}

// Generic date formatter
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Generic retry mechanism
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Generic environment variable validator
export function validateEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Generic response transformer
export function transformResponse<TInput, TOutput>(
  data: TInput[],
  transformer: (item: TInput) => TOutput
): TOutput[] {
  return data.map(transformer);
}