import { Router } from 'express';
import { getIssues, createIssue, updateIssue, calculateStoryPoints, calculateWorklogHours } from '../services/jiraService';
import { createStoryPointsExcel, createWorklogExcel, getExcelMimeType, getExcelFileName } from '../utils/excelExport';
import { generateJQL } from '../llm/generateJql';

const router = Router();

// Get all issues
router.get('/issues', async (req, res) => {
  try {
    const issues = await getIssues();
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch JIRA issues' });
  }
});

// Create new issue
router.post('/issues', async (req, res) => {
  try {
    const issue = await createIssue(req.body);
    res.status(201).json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create JIRA issue' });
  }
});

// Update issue
router.put('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await updateIssue(id, req.body);
    res.json(issue);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update JIRA issue' });
  }
});

// Calculate story points for assignees
router.post('/story-points', async (req, res) => {
  try {
    const { query, assignees, sprint, jql } = req.body;
    
    let finalJql = jql;
    if (!finalJql && query) {
      // Generate JQL from natural language query
      finalJql = await generateJQL(query);
      console.log(`Generated JQL for story points: ${finalJql}`);
    }

    if (!finalJql) {
      res.status(400).json({ error: 'Either JQL query or natural language query is required' });
      return;
    }

    const storyPointsData = await calculateStoryPoints(finalJql, assignees, sprint);
    
    res.json({
      summary: storyPointsData,
      jql: finalJql,
      query: query || 'JQL query',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating story points:', error);
    res.status(500).json({ error: 'Failed to calculate story points' });
  }
});

// Test endpoint for debugging export functionality
router.get('/test-export', (req, res) => {
  console.log('🧪 Test export endpoint accessed');
  res.json({ message: 'Export routes are working', timestamp: new Date().toISOString() });
});

// Export story points to Excel
router.post('/story-points/export', async (req, res) => {
  console.log('🚀 STORY POINTS EXPORT ROUTE ACCESSED!');
  console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📊 Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    console.log('📊 Excel export request received:', req.body);
    const { query, assignees, sprint, jql, fileName } = req.body;
    
    let finalJql = jql;
    if (!finalJql && query) {
      console.log('🔄 Generating JQL from query:', query);
      finalJql = await generateJQL(query);
      console.log('📝 Generated JQL:', finalJql);
    }

    if (!finalJql) {
      console.log('❌ No JQL provided');
      res.status(400).json({ error: 'Either JQL query or natural language query is required' });
      return;
    }

    console.log('📊 Calculating story points for export...');
    const storyPointsData = await calculateStoryPoints(finalJql, assignees, sprint);
    console.log('📈 Story points data:', storyPointsData?.length || 0, 'records');
    
    console.log('📋 Creating Excel file...');
    const excelBuffer = createStoryPointsExcel(storyPointsData, {
      fileName: fileName || 'story-points-report',
      includeDetailedView: true
    });

    const excelFileName = getExcelFileName(fileName || 'story-points-report');
    console.log('📁 Excel file created:', excelFileName, 'Size:', excelBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', getExcelMimeType());
    res.setHeader('Content-Disposition', `attachment; filename="${excelFileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log('✅ Sending Excel file to client');
    res.send(excelBuffer);
  } catch (error) {
    console.error('❌ Error exporting story points to Excel:', error);
    res.status(500).json({ 
      error: 'Failed to export story points to Excel', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export worklog to Excel (existing functionality enhancement)
router.post('/worklog/export', async (req, res) => {
  try {
    const { jql, userNames, startDate, endDate, fileName } = req.body;
    
    if (!jql) {
      res.status(400).json({ error: 'JQL query is required for worklog export' });
      return;
    }

    const worklogData = await calculateWorklogHours(jql, userNames || [], startDate, endDate);
    
    const excelBuffer = createWorklogExcel(worklogData, {
      fileName: fileName || 'worklog-report'
    });

    const excelFileName = getExcelFileName(fileName || 'worklog-report');
    
    res.setHeader('Content-Type', getExcelMimeType());
    res.setHeader('Content-Disposition', `attachment; filename="${excelFileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting worklog to Excel:', error);
    res.status(500).json({ error: 'Failed to export worklog to Excel' });
  }
});

export default router;
