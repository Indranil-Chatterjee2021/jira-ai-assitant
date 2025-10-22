const { generateJQL } = require('../llm/generateJql');

describe('JQL Generator', () => {
  it('should convert natural query to JQL', async () => {
    const input = 'Show me all open bugs assigned to John';
    const jql = await generateJQL(input);
    expect(jql).toMatch(/project|status|assignee/i);
  });
});
