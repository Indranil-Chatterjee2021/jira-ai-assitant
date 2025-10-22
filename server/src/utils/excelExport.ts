import * as XLSX from 'xlsx';
import { StoryPointsSummary } from '../types/jiraTypes';

export interface ExcelExportOptions {
  fileName?: string;
  sheetName?: string;
  includeCharts?: boolean;
  includeDetailedView?: boolean;
}

export function createStoryPointsExcel(
  storyPointsData: StoryPointsSummary[],
  options: ExcelExportOptions = {}
): Buffer {
  const {
    fileName = 'story-points-report',
    sheetName = 'Story Points Summary',
    includeDetailedView = true
  } = options;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet data
  const summaryData = [
    ['Story Points Report', '', '', '', '', ''],
    ['Generated on:', new Date().toLocaleString(), '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Assignee', 'Total Points', 'Completed', 'In Progress', 'To Do', '% Complete'],
    ...storyPointsData.map(summary => [
      summary.assignee,
      summary.totalStoryPoints,
      summary.completedStoryPoints,
      summary.inProgressStoryPoints,
      summary.todoStoryPoints,
      summary.totalStoryPoints > 0 
        ? Math.round((summary.completedStoryPoints / summary.totalStoryPoints) * 100) 
        : 0
    ]),
    ['', '', '', '', '', ''],
    ['Totals:', 
      storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0),
      storyPointsData.reduce((sum, s) => sum + s.completedStoryPoints, 0),
      storyPointsData.reduce((sum, s) => sum + s.inProgressStoryPoints, 0),
      storyPointsData.reduce((sum, s) => sum + s.todoStoryPoints, 0),
      storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0) > 0
        ? Math.round((storyPointsData.reduce((sum, s) => sum + s.completedStoryPoints, 0) / 
          storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0)) * 100)
        : 0
    ]
  ];

  // Create worksheet from array of arrays
  const ws = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Assignee
    { wch: 12 }, // Total Points
    { wch: 12 }, // Completed
    { wch: 12 }, // In Progress
    { wch: 10 }, // To Do
    { wch: 12 }  // % Complete
  ];

  // Style the header row
  const headerRow = 4; // 0-based, so row 5 in Excel
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1');
  
  // Apply styles to header row (basic styling since xlsx has limited formatting)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: col });
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } }
      };
    }
  }

  // Add the summary sheet
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Add detailed view if requested
  if (includeDetailedView && storyPointsData.length > 0) {
    const detailedData = [
      ['Detailed Issues Report', '', '', ''],
      ['', '', '', ''],
      ['Issue Key', 'Summary', 'Assignee', 'Story Points', 'Status'],
    ];

    // Add all issues from all assignees
    storyPointsData.forEach(summary => {
      summary.issues.forEach(issue => {
        detailedData.push([
          issue.key,
          issue.summary,
          summary.assignee,
          issue.storyPoints.toString(),
          issue.status
        ]);
      });
    });

    const detailedWs = XLSX.utils.aoa_to_sheet(detailedData);
    
    // Set column widths for detailed view
    detailedWs['!cols'] = [
      { wch: 12 }, // Issue Key
      { wch: 50 }, // Summary
      { wch: 20 }, // Assignee
      { wch: 12 }, // Story Points
      { wch: 15 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Issues');
  }

  // Add statistics sheet
  if (storyPointsData.length > 0) {
    const statsData = [
      ['Statistics & Analytics', '', ''],
      ['', '', ''],
      ['Metric', 'Value', 'Details'],
      ['Total Assignees', storyPointsData.length, ''],
      ['Total Story Points', storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0), ''],
      ['Average Points per Assignee', 
        Math.round((storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0) / storyPointsData.length) * 100) / 100, 
        ''
      ],
      ['Completion Rate', 
        Math.round((storyPointsData.reduce((sum, s) => sum + s.completedStoryPoints, 0) / 
        storyPointsData.reduce((sum, s) => sum + s.totalStoryPoints, 0)) * 100) || 0, 
        '%'
      ],
      ['', '', ''],
      ['Top Performers', '', ''],
      ['Assignee', 'Completed Points', '% of Total'],
    ];

    // Add top performers (sorted by completed points)
    const topPerformers = [...storyPointsData]
      .sort((a, b) => b.completedStoryPoints - a.completedStoryPoints)
      .slice(0, 5); // Top 5

    topPerformers.forEach(summary => {
      const totalCompleted = storyPointsData.reduce((sum, s) => sum + s.completedStoryPoints, 0);
      const percentageOfTotal = totalCompleted > 0 
        ? Math.round((summary.completedStoryPoints / totalCompleted) * 100)
        : 0;
      
      statsData.push([
        summary.assignee,
        summary.completedStoryPoints,
        percentageOfTotal
      ]);
    });

    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    
    // Set column widths for stats view
    statsWs['!cols'] = [
      { wch: 25 }, // Metric/Assignee
      { wch: 15 }, // Value/Points
      { wch: 15 }  // Details/Percentage
    ];

    XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
  }

  // Write to buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function createWorklogExcel(
  worklogData: any[],
  options: ExcelExportOptions = {}
): Buffer {
  const {
    sheetName = 'Worklog Summary'
  } = options;

  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['Worklog Hours Report', '', '', ''],
    ['Generated on:', new Date().toLocaleString(), '', ''],
    ['', '', '', ''],
    ['User', 'Total Hours', 'Entries', 'Avg Hours/Entry'],
    ...worklogData.map(worklog => [
      worklog.user,
      worklog.totalHours,
      worklog.entries,
      worklog.entries > 0 ? Math.round((worklog.totalHours / worklog.entries) * 100) / 100 : 0
    ]),
    ['', '', '', ''],
    ['Totals:', 
      worklogData.reduce((sum, w) => sum + w.totalHours, 0),
      worklogData.reduce((sum, w) => sum + w.entries, 0),
      ''
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  ws['!cols'] = [
    { wch: 20 }, // User
    { wch: 12 }, // Total Hours
    { wch: 10 }, // Entries
    { wch: 15 }  // Avg Hours/Entry
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function getExcelMimeType(): string {
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

export function getExcelFileName(baseFileName: string = 'report'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${baseFileName}-${timestamp}.xlsx`;
}