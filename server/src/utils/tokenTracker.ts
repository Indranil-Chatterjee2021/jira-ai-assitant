export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  queryCount: number;
  timestamp: string;
}

interface TokenStats {
  totalQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  sessionStart: string;
  lastQuery: string;
}

class TokenTracker {
  private stats: TokenStats;

  constructor() {
    this.stats = {
      totalQueries: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      sessionStart: new Date().toISOString(),
      lastQuery: new Date().toISOString()
    };
  }

  // Estimate tokens for text (approximation: 1 token ≈ 4 characters for English)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  trackUsage(inputText: string, outputText: string, exactInputTokens?: number, exactOutputTokens?: number): TokenUsage {
    // Use exact token counts if provided (for caching scenarios), otherwise estimate
    const inputTokens = exactInputTokens ?? this.estimateTokens(inputText);
    const outputTokens = exactOutputTokens ?? this.estimateTokens(outputText);
    const totalTokens = inputTokens + outputTokens;

    this.stats.totalQueries += 1;
    this.stats.totalInputTokens += inputTokens;
    this.stats.totalOutputTokens += outputTokens;
    this.stats.totalTokens += totalTokens;
    this.stats.lastQuery = new Date().toISOString();

    const usage: TokenUsage = {
      inputTokens,
      outputTokens,
      totalTokens,
      queryCount: this.stats.totalQueries,
      timestamp: this.stats.lastQuery
    };

    return usage;
  }

  getStats(): TokenStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      sessionStart: new Date().toISOString(),
      lastQuery: new Date().toISOString()
    };
  }
}

// Global instance
export const tokenTracker = new TokenTracker();

// Helper function to track AI API calls
export function trackAICall(inputText: string, outputText: string, exactInputTokens?: number, exactOutputTokens?: number): TokenUsage {
  return tokenTracker.trackUsage(inputText, outputText, exactInputTokens, exactOutputTokens);
}

export function getTokenStats(): TokenStats {
  return tokenTracker.getStats();
}