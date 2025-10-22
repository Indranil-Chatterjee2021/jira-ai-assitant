/**
 * Utility functions to parse JIRA time formats
 */

/**
 * Parse JIRA time spent format (e.g., "1d 4h 30m", "2w 3d", "8h", "45m")
 * Returns total hours as a decimal number
 */
export function parseTimeSpent(timeSpent: string): number {
  if (!timeSpent || typeof timeSpent !== 'string') {
    return 0;
  }

  let totalHours = 0;
  const timeString = timeSpent.toLowerCase().trim();

  // Define conversion rates to hours
  // TODO: These should ideally come from JIRA configuration
  const conversions = {
    w: 40, // 1 week = 40 hours (5 working days) - may need to be 168 for calendar days
    d: 8,  // 1 day = 8 hours (working day) - may need to be 24 for calendar days  
    h: 1,  // 1 hour = 1 hour
    m: 1/60, // 1 minute = 1/60 hours
    s: 1/3600 // 1 second = 1/3600 hours
  };

  // Match patterns like "2w", "3d", "4h", "30m", "45s"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*w/g, // weeks
    /(\d+(?:\.\d+)?)\s*d/g, // days
    /(\d+(?:\.\d+)?)\s*h/g, // hours
    /(\d+(?:\.\d+)?)\s*m/g, // minutes
    /(\d+(?:\.\d+)?)\s*s/g  // seconds
  ];

  const units = ['w', 'd', 'h', 'm', 's'];

  patterns.forEach((pattern, index) => {
    const unit = units[index];
    const matches = [...timeString.matchAll(pattern)];
    
    matches.forEach(match => {
      const value = parseFloat(match[1]);
      totalHours += value * conversions[unit as keyof typeof conversions];
    });
  });

  // If no units found, try to parse as plain number (assume hours)
  if (totalHours === 0) {
    const numericValue = parseFloat(timeString);
    if (!isNaN(numericValue)) {
      totalHours = numericValue;
    }
  }

  return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Format hours back to a readable string
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
}

/**
 * Test function to validate parsing
 */
export function testTimeParser() {
  const testCases = [
    { input: '1d', expected: 8 },
    { input: '2w', expected: 80 },
    { input: '4h', expected: 4 },
    { input: '30m', expected: 0.5 },
    { input: '1d 4h 30m', expected: 12.5 },
    { input: '2w 3d 2h', expected: 106 },
    { input: '45m', expected: 0.75 },
    { input: '1h 15m', expected: 1.25 },
    { input: '8', expected: 8 }
  ];

  console.log('🧪 Testing time parser:');
  testCases.forEach(({ input, expected }) => {
    const result = parseTimeSpent(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → ${result}h (expected: ${expected}h)`);
  });
}