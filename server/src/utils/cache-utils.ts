/**
 * Cache management utilities for JIRA AI Assistant
 */

import { invalidateCache } from '../llm/generateJql';

export function clearLLMCache(): void {
  invalidateCache();
  console.log('🧹 LLM cache cleared successfully');
}

export function logCacheStatus(): void {
  console.log('📊 Cache Status:');
  console.log('- Next query will check cache expiry');
  console.log('- Updated system prompt will be loaded on cache refresh');
}

// CLI utility for manual cache management
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'clear':
      clearLLMCache();
      break;
    case 'status':
      logCacheStatus();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run cache clear  - Clear the LLM cache');
      console.log('  npm run cache status - Show cache status');
  }
}
