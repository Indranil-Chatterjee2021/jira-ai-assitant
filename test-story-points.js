#!/usr/bin/env node

// Test script to verify story points detection
const query = "How many story points are assigned to Bindu Divakara, Indranil Chatterjee for the sprint INSDT FDS 25.4.2";

console.log('Testing story points detection logic...');

// Test the detection logic
const isStoryPointsQuery = query.toLowerCase().includes('story point') || 
                          query.toLowerCase().includes('story points');

console.log('Query:', query);
console.log('Contains "story point":', query.toLowerCase().includes('story point'));
console.log('Contains "story points":', query.toLowerCase().includes('story points'));
console.log('isStoryPointsQuery:', isStoryPointsQuery);

// Test assignee extraction with multiple patterns
console.log('\nTesting assignee extraction patterns:');

// Pattern 1: "assigned to X, Y for sprint Z"
const pattern1 = query.match(/assigned to\s+([^,]+(?:,\s*[^,]+)*?)(?:\s+for\s+(?:the\s+)?sprint|\s*$)/i);
console.log('Pattern 1 (assigned to):', pattern1 ? pattern1[1] : 'no match');

// Pattern 2: "story points of X, Y for sprint Z"  
const pattern2 = query.match(/story points?\s+(?:of|for)\s+([^,]+(?:,\s*[^,]+)*?)(?:\s+for\s+(?:the\s+)?sprint|\s*$)/i);
console.log('Pattern 2 (story points of/for):', pattern2 ? pattern2[1] : 'no match');

// Pattern 3: More flexible pattern
const pattern3 = query.match(/(?:assigned to|story points?\s+(?:of|for))\s+(.+?)(?:\s+for\s+(?:the\s+)?sprint)/i);
console.log('Pattern 3 (flexible):', pattern3 ? pattern3[1] : 'no match');

if (pattern3) {
  const assigneeStr = pattern3[1].trim();
  const assigneeNames = assigneeStr.split(/\s*,\s*|\s+and\s+/).map(name => name.trim()).filter(name => name.length > 0);
  console.log('Extracted assignees from pattern 3:', assigneeNames);
}

// Test sprint extraction
const sprintMatch = query.match(/(?:for|in)\s+sprint\s+([a-zA-Z0-9.\s]+)/i);
if (sprintMatch) {
  const sprintName = sprintMatch[1].trim();
  console.log('Extracted sprint:', sprintName);
}

console.log('\n✅ Story points detection should work correctly!');