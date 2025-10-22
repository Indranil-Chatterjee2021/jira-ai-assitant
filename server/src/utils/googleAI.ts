import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGoogleAI(): GoogleGenerativeAI | null {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn('Google AI API key not found in environment variables');
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Google AI:', error);
    return null;
  }
}
