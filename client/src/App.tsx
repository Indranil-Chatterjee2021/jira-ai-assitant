import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,

  Paper,
  TextField,
  Button,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Chip,
  InputAdornment,
  Fade,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  SmartToy,
  Assignment,
  AutoAwesome,
  Timeline,
  Schedule,
  Person,
  Download,
  Clear as ClearIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import JiraIssueList from './components/JiraIssueList';
import './App.css';

interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: {
      content: Array<{
        content: Array<{
          text: string;
        }>;
      }>;
    };
    status?: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    created?: string;
    updated?: string;
    sprint?: {
      id: number;
      name: string;
      state: string;
    };
    worklog?: {
      worklogs: Array<{
        author: {
          displayName: string;
        };
        updateAuthor: {
          displayName: string;
        };
        timeSpent: string;
        started: string;
      }>;
      total: number;
    };
  };
}

// Create Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      light: '#8b5cf6',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

interface TokenStats {
  totalQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  sessionStart: string;
  lastQuery: string;
}

interface ConnectionStatus {
  jira: string;
  ai: string;
}

interface WorklogSummary {
  user: string;
  totalHours: number;
  totalMinutes: number;
  entries: number;
}

// Helper function to safely extract text from JIRA description objects
// const extractTextFromDescription = (description: any): string => {
//   if (!description) return '';
//   if (typeof description === 'string') return description;
  
//   try {
//     if (description.content && Array.isArray(description.content)) {
//       return description.content
//         .map((block: any) => {
//           if (block.content && Array.isArray(block.content)) {
//             return block.content
//               .map((inline: any) => inline.text || '')
//               .join('')
//           }
//           return block.text || '';
//         })
//         .join('\n');
//     }
//   } catch (e) {
//     console.warn('Error extracting text from description:', e);
//   }
  
//   return 'Description format not supported';
// };

// Helper function to safely render any potentially complex content
const safeRender = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number') return String(content);
  
  try {
    return JSON.stringify(content);
  } catch (e) {
    return 'Unable to display content';
  }
};



function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Issue[]>([]);
  const [filteredResults, setFilteredResults] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ jira: 'unknown', ai: 'unknown' });
  const [worklogSummary, setWorklogSummary] = useState<WorklogSummary[] | null>(null);
  const [isWorklogQuery, setIsWorklogQuery] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{startDate: string | null; endDate: string | null}>({startDate: null, endDate: null});
  const [storyPointsSummary, setStoryPointsSummary] = useState<any[] | null>(null);
  const [isStoryPointsQuery, setIsStoryPointsQuery] = useState(false);
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);

  // Fetch token statistics
  const fetchTokenStats = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/stats/tokens');
      if (res.ok) {
        const stats = await res.json();
        setTokenStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch token stats:', err);
    }
  }, []);

  // Fetch connection status
  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/health');
      if (res.ok) {
        const health = await res.json();
        if (health.connections) {
          setConnectionStatus(health.connections);
        }
      }
    } catch (err) {
      console.error('Failed to fetch connection status:', err);
    }
  }, []);

  // Fetch stats on component mount and after queries
  React.useEffect(() => {
    fetchConnectionStatus();
    fetchTokenStats();
    
    // Refresh connection status every 30 seconds
    const interval = setInterval(fetchConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchConnectionStatus, fetchTokenStats]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
    const res = await fetch('http://localhost:3001/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
      
      if (!res.ok) {
        throw new Error('Failed to fetch results');
      }
      
    const data = await res.json();
    setResults(data.issues || []);
      setWorklogSummary(data.worklogSummary || null);
      setIsWorklogQuery(data.metadata?.isWorklogQuery || false);
      setStoryPointsSummary(data.storyPointsSummary || null);
      setIsStoryPointsQuery(data.metadata?.isStoryPointsQuery || false);
      setDateRange({
        startDate: data.metadata?.startDate || null,
        endDate: data.metadata?.endDate || null
      });
      
      // Calculate total story points from issues
      const totalSP = (data.issues || []).reduce((sum: number, issue: any) => {
        const sp = issue.fields.storyPoints || 0;
        return sum + sp;
      }, 0);
      setTotalStoryPoints(totalSP);
      
      setFilteredResults(data.issues);
      setSelectedAssignee(null);
      
      // Refresh token stats after query
      setTimeout(fetchTokenStats, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
    setLoading(false);
    }
  };



  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleAssigneeClick = (assigneeName: string) => {
    setSelectedAssignee(assigneeName);
    
    // Check if we have story points data or worklog data
    const hasStoryPointsData = storyPointsSummary && storyPointsSummary.length > 0;
    
    if (hasStoryPointsData) {
      // For story points: filter issues assigned to the selected person
      const filtered = results.filter(issue => {
        const issueAssignee = issue.fields.assignee?.displayName || '';
        return issueAssignee.toLowerCase().includes(assigneeName.toLowerCase()) ||
               assigneeName.toLowerCase().includes(issueAssignee.toLowerCase());
      });
      setFilteredResults(filtered);
    } else {
      // For worklog: filter issues to only show those where the selected person actually logged time within the date range
      const filtered = results.filter(issue => {
        // Only check worklog authors (who actually logged the time)
        const isWorklogAuthor = issue.fields.worklog?.worklogs?.some(worklog => {
          // Check if the worklog author matches
          const authorMatches = worklog.author?.displayName?.toLowerCase().includes(assigneeName.toLowerCase()) ||
            assigneeName.toLowerCase().includes(worklog.author?.displayName?.toLowerCase() || '');
          
          if (!authorMatches) return false;
          
          // If we have a date range, also check if the worklog is within that range
          if (dateRange.startDate && dateRange.endDate && worklog.started) {
            const worklogDateStr = worklog.started.split('T')[0]; // Extract YYYY-MM-DD
            const isInDateRange = worklogDateStr >= dateRange.startDate && worklogDateStr <= dateRange.endDate;
            return isInDateRange;
          }
          
          // If no date range specified, include all worklogs by this author
          return true;
        }) || false;
        
        return isWorklogAuthor;
      });
      setFilteredResults(filtered);
    }
    
    setSelectedIssue(null); // Clear selected issue when filtering
  };

  const handleClearFilter = () => {
    setSelectedAssignee(null);
    setFilteredResults(results);
    setSelectedIssue(null);
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setFilteredResults([]);
    setSelectedIssue(null);
    setWorklogSummary(null);
    setIsWorklogQuery(false);
    setStoryPointsSummary(null);
    setIsStoryPointsQuery(false);
    setTotalStoryPoints(0);
    setSelectedAssignee(null);
    setDateRange({startDate: null, endDate: null});
    setError(null);
  };



  const handleExportStoryPoints = useCallback(async () => {
    console.log('📊 Export button clicked');
    if (!storyPointsSummary || storyPointsSummary.length === 0) {
      console.log('❌ No story points data to export');
      return;
    }

    console.log('📋 Exporting story points:', storyPointsSummary.length, 'records');
    console.log('🔗 Query:', query);

    try {
      console.log('🌐 Making export request...');
      const response = await fetch('http://localhost:3001/api/jira/story-points/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          fileName: 'story-points-report'
        }),
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Export successful, creating blob...');
        const blob = await response.blob();
        console.log('📁 Blob size:', blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-points-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('💾 Download triggered successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Export failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Export error:', error);
    }
  }, [storyPointsSummary, query]);

  const handleExportWorklog = useCallback(() => {
    if (!worklogSummary || worklogSummary.length === 0) {
      return;
    }

    // Prepare data for Excel export
    const excelData = worklogSummary.map(summary => ({
      'Resource Name': summary.user,
      'Total Hours': `${summary.totalHours} Hrs`,
      'Entries': summary.entries
    }));

    // Add summary row
    const totalHours = worklogSummary.reduce((total, summary) => total + summary.totalHours, 0);
    const totalEntries = worklogSummary.reduce((total, summary) => total + summary.entries, 0);
    
    excelData.push({
      'Resource Name': 'Summary',
      'Total Hours': `${totalHours.toFixed(1)} Hrs`,
      'Entries': totalEntries
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    ws['!cols'] = [
      { width: 25 }, // Resource Name
      { width: 15 }, // Total Hours
      { width: 10 }  // Entries
    ];

    // Add borders and styling to all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:C1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Initialize cell style
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        
        // Add borders to all cells
        ws[cellAddress].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
        
        // Style header row (first row)
        if (R === 0) {
          ws[cellAddress].s.font = { bold: true };
          ws[cellAddress].s.fill = { 
            patternType: 'solid', 
            fgColor: { rgb: 'D3D3D3' } 
          };
        }
        
        // Style summary row (last row)
        if (R === range.e.r && excelData[R - 1] && excelData[R - 1]['Resource Name'] === 'Summary') {
          ws[cellAddress].s.font = { bold: true };
          ws[cellAddress].s.fill = { 
            patternType: 'solid', 
            fgColor: { rgb: 'E3F2FD' } 
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Worklog Summary');
    
    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `Worklog_Summary_${dateStr}.xlsx`;
    
    // Download the file
    XLSX.writeFile(wb, filename);
  }, [worklogSummary]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1, 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Header */}
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left side - Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  p: 1,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SmartToy sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  JIRA AI Assistant
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Intelligent issue management with AI insights
                </Typography>
              </Box>
            </Box>

            {/* Center - Token Usage */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.9rem', fontWeight: 700 }}>
                Token Usage: 
                <span style={{ fontWeight: 800, marginLeft: '6px', color: '#1976d2' }}>
                  Queries: {tokenStats?.totalQueries ?? 0} | Total: {(tokenStats?.totalTokens ?? 0).toLocaleString()}
                </span>
              </Typography>
            </Box>

            {/* Right side - Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 500 }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: connectionStatus.jira === 'connected' ? '#2e7d32' : '#d32f2f'
                }}>
                  JIRA: {connectionStatus.jira === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
                <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                <span style={{ 
                  fontWeight: 600, 
                  color: connectionStatus.ai === 'connected' ? '#2e7d32' : '#d32f2f'
                }}>
                  AI: {connectionStatus.ai === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
          <Fade in timeout={300}>
            <Box>
                {/* Search Section */}
                <Paper sx={{ p: 4, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AutoAwesome sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      Smart Issue Search
                    </Typography>
                  </Box>
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Ask about JIRA issues in natural language..."
        value={query}
        onChange={(e) => {
          const newValue = e.target.value;
          setQuery(newValue);
          // Clear results when text field is modified (partial or complete deletion)
          setResults([]);
          setFilteredResults([]);
          setSelectedIssue(null);
          setWorklogSummary(null);
          setIsWorklogQuery(false);
          setStoryPointsSummary(null);
          setIsStoryPointsQuery(false);
          setTotalStoryPoints(0);
          setSelectedAssignee(null);
          setDateRange({startDate: null, endDate: null});
          setError(null);
        }}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: query && (
                          <InputAdornment position="end">
                            <Button
                              onClick={handleClearQuery}
                              size="small"
                              variant="outlined"
                              startIcon={<ClearIcon />}
                              sx={{ 
                                mr: 1,
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                minWidth: 'auto',
                                px: 1.5,
                                py: 0.5,
                                border: '1px solid',
                                borderColor: 'grey.300',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              Clear
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || !query.trim()}
                      startIcon={loading ? null : <SearchIcon />}
                      fullWidth
                      sx={{ height: 48 }}
                    >
                      {loading ? 'Searching...' : 'Search Issues'}
                    </Button>
                  </Box>

                  {error && (
                    <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    </Slide>
                  )}
                </Paper>

                {/* Story Points Summary Table */}
                {storyPointsSummary && storyPointsSummary.length > 0 && results.length > 0 && (
                  <Fade in timeout={500}>
                    <Paper sx={{ mb: 3 }}>
                      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AutoAwesome sx={{ color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Story Points Summary
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={handleExportStoryPoints}
                          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                        >
                          Export to Excel
                        </Button>
                      </Box>
                      
                      <Divider />
                      
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Assignee
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Total Points
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Completed
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                In Progress
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                To Do
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Issues
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {storyPointsSummary.map((summary, index) => (
                              <TableRow
                                key={summary.assignee}
                                component={motion.tr}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                sx={{ 
                                  '&:hover': { bgcolor: 'action.hover' },
                                  '&:last-child td': { border: 0 }
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        color: 'primary.main',
                                        '&:hover': {
                                          textDecoration: 'underline'
                                        }
                                      }}
                                      onClick={() => handleAssigneeClick(summary.assignee)}
                                    >
                                      {summary.assignee}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {summary.totalStoryPoints} SP
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${summary.completedStoryPoints} SP`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${summary.inProgressStoryPoints} SP`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={`${summary.todoStoryPoints} SP`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={summary.issueCount}
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Summary Row */}
                            <TableRow sx={{ bgcolor: 'primary.50', '& td': { border: 'none', fontWeight: 600 } }}>
                              <TableCell>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  Summary
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {storyPointsSummary.reduce((total, summary) => total + summary.totalStoryPoints, 0)} SP
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${storyPointsSummary.reduce((total, summary) => total + summary.completedStoryPoints, 0)} SP`}
                                  size="small"
                                  color="success"
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${storyPointsSummary.reduce((total, summary) => total + summary.inProgressStoryPoints, 0)} SP`}
                                  size="small"
                                  color="warning"
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${storyPointsSummary.reduce((total, summary) => total + summary.todoStoryPoints, 0)} SP`}
                                  size="small"
                                  color="info"
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={storyPointsSummary.reduce((total, summary) => total + summary.issueCount, 0)}
                                  size="small"
                                  color="primary"
                                  variant="filled"
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Fade>
                )}

                {/* Worklog Summary Table */}
                {worklogSummary && worklogSummary.length > 0 && results.length > 0 && (
                  <Fade in timeout={500}>
                    <Paper sx={{ mb: 3 }}>
                      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule sx={{ color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Worklog Summary
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={handleExportWorklog}
                          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                        >
                          Export to Excel
                        </Button>
                      </Box>
                      
                      <Divider />
                      
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Resource Name
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Total Hours
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                Entries
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {worklogSummary.map((summary, index) => (
                              <TableRow
                                key={summary.user}
                                component={motion.tr}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                sx={{ 
                                  '&:hover': { bgcolor: 'action.hover' },
                                  '&:last-child td': { border: 0 }
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        color: 'primary.main',
                                        '&:hover': {
                                          textDecoration: 'underline'
                                        }
                                      }}
                                      onClick={() => handleAssigneeClick(summary.user)}
                                    >
                                      {summary.user}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {summary.totalHours} Hrs
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip 
                                    label={summary.entries}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Summary Row */}
                            <TableRow sx={{ bgcolor: 'primary.50', '& td': { border: 'none', fontWeight: 600 } }}>
                              <TableCell>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  Summary
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {worklogSummary.reduce((total, summary) => total + summary.totalHours, 0).toFixed(1)} Hrs
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={worklogSummary.reduce((total, summary) => total + summary.entries, 0)}
                                  size="small"
                                  color="primary"
                                  variant="filled"
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Fade>
                )}

                {/* Issues List for Worklog Queries */}
                {isWorklogQuery && worklogSummary && filteredResults.length > 0 && results.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Paper sx={{ mb: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Assignment />
                          {selectedAssignee ? `Issues for ${selectedAssignee}` : 'Related Issues'}
                        </Typography>
                        {selectedAssignee && (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={handleClearFilter}
                            sx={{ textTransform: 'none' }}
                          >
                            Show All Issues
                          </Button>
                        )}
                      </Box>
                    </Paper>
                    <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
                      {/* Issues List */}
                      <Box sx={{ flex: { lg: 2 } }}>
                        <JiraIssueList 
                          issues={filteredResults} 
                          onSelectIssue={handleSelectIssue}
                          loading={loading}
                        />
                      </Box>

                      {/* Issue Detail */}
                      <Box sx={{ flex: { lg: 1 } }}>
                        <AnimatePresence>
                          {selectedIssue && (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                            >
                              <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                                  <Box>
                                    <Typography variant="h6">{safeRender(selectedIssue.key)}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Issue Details
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                <Box sx={{ space: 2 }}>
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                      Summary
                                    </Typography>
                                    <Typography variant="body2">
                                      {safeRender(selectedIssue.fields.summary)}
                                    </Typography>
                                  </Box>

                                  {selectedIssue.fields.worklog && selectedIssue.fields.worklog.worklogs && selectedIssue.fields.worklog.worklogs.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Time Logged
                                      </Typography>
                                      {selectedIssue.fields.worklog.worklogs.map((worklog: any, index: number) => (
                                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                                            {safeRender(worklog.author?.displayName || 'Unknown Author')}
                                          </Typography>
                                          <Typography variant="body2">
                                            {safeRender(worklog.timeSpent || 'No time')} - {worklog.started ? new Date(worklog.started).toLocaleDateString() : 'Unknown date'}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}

                                  {selectedIssue.fields.status && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Status
                                      </Typography>
                                      <Chip 
                                        label={safeRender(selectedIssue.fields.status.name)}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Box>
                                  )}

                                  {selectedIssue.fields.assignee && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Assignee
                                      </Typography>
                                      <Typography variant="body2">
                                        {safeRender(selectedIssue.fields.assignee.displayName)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {selectedIssue.fields.priority && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Priority
                                      </Typography>
                                      <Chip 
                                        label={safeRender(selectedIssue.fields.priority.name)}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                      />
                                    </Box>
                                  )}

                                  {selectedIssue.fields.sprint && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Sprint
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Timeline sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Chip 
                                          label={safeRender(selectedIssue.fields.sprint.name)}
                                          size="small"
                                          color="info"
                                          variant="outlined"
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Paper>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Results Grid - Hide for worklog queries */}
                {!isWorklogQuery && results.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
                    {/* Issues List */}
                    <Box sx={{ flex: { lg: 2 } }}>
                      {/* Filter indicator for regular queries */}
                      {selectedAssignee && filteredResults.length > 0 && (
                        <Paper sx={{ mb: 2, p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Assignment />
                              Issues for {selectedAssignee}
                            </Typography>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={handleClearFilter}
                              sx={{ textTransform: 'none' }}
                            >
                              Show All Issues
                            </Button>
                          </Box>
                        </Paper>
                      )}
                      
                      <JiraIssueList 
                        issues={filteredResults} 
                        onSelectIssue={handleSelectIssue}
                        loading={loading}
                        showStoryPoints={isStoryPointsQuery}
                        totalStoryPoints={totalStoryPoints}
                        onExportExcel={!isStoryPointsQuery && worklogSummary ? handleExportWorklog : undefined}
                      />
                    </Box>

                  {/* Issue Detail */}
                  <Box sx={{ flex: { lg: 1 } }}>
                    <AnimatePresence>
                      {selectedIssue && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="h6">{selectedIssue.key}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Issue Details
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ space: 2 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                  Summary
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {safeRender(selectedIssue.fields.summary)}
                                </Typography>
                              </Box>
                              
                              {selectedIssue.fields.status && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Status
                                  </Typography>
                                  <Chip
                                    label={safeRender(selectedIssue.fields.status.name)}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                              )}
                              
                              {selectedIssue.fields.priority && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Priority
                                  </Typography>
                                  <Chip
                                    label={safeRender(selectedIssue.fields.priority.name)}
                                    color="warning"
                                    variant="outlined"
                                    size="small"
                                  />
                                </Box>
                              )}
                              
                              {selectedIssue.fields.sprint && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Sprint
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Timeline sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Chip
                                      label={safeRender(selectedIssue.fields.sprint.name)}
                                      color="info"
                                      variant="outlined"
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                              )}
                              
                              {selectedIssue.fields.assignee && (
                                <Box>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Assignee
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {safeRender(selectedIssue.fields.assignee.displayName)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Paper>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Box>
                )}
              </Box>
            </Fade>

        </Container>
        
        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 2,
            px: 3,
            mt: 'auto'
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Powered By:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <SmartToy sx={{ fontSize: 20, color: '#4285F4' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Google Gemini {process.env.REACT_APP_GEMINI_VERSION || 'Unknown Version'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Developed By:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Person sx={{ fontSize: 20, color: '#00C853' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {process.env.REACT_APP_DEVELOPER || 'Unknown Developer'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  JiraAI Ver:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <AutoAwesome sx={{ fontSize: 20, color: '#FF6F00' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    v{process.env.REACT_APP_VERSION || '0.0.0'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
