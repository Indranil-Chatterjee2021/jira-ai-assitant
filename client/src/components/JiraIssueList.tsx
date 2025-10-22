import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Fade,
  Button,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Person,
  Error,
  CheckCircle,
  Cancel,
  // Search,
  KeyboardArrowRight,
  Flag,
  Timeline,
  GetApp,
  Star
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

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
    storyPoints?: number;
  };
}

interface Props {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  loading?: boolean;
  showStoryPoints?: boolean;
  onExportExcel?: () => void;
  totalStoryPoints?: number;
}

const getPriorityColor = (priority?: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  switch (priority?.toLowerCase()) {
    case 'highest':
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    case 'lowest':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'closed':
    case 'resolved':
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case 'in progress':
    case 'in review':
      return <Schedule sx={{ color: 'primary.main' }} />;
    case 'blocked':
      return <Cancel sx={{ color: 'error.main' }} />;
    default:
      return <Error sx={{ color: 'grey.500' }} />;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const JiraIssueList: React.FC<Props> = ({ 
  issues, 
  onSelectIssue, 
  loading = false, 
  showStoryPoints = false,
  onExportExcel,
  totalStoryPoints = 0
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={40} />
          <Typography color="text.secondary">Searching for issues...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!issues || issues.length === 0) {
    return null; // Hide the entire container when no issues are available
  }

  return (
    <Fade in timeout={300}>
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment />
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            Search Results
          </Typography>
          {showStoryPoints && totalStoryPoints > 0 && (
            <Chip 
              label={`${totalStoryPoints} Story Points`} 
              size="small"
              icon={<Star sx={{ color: 'white !important' }} />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 1 }}
            />
          )}
          <Chip 
            label={`${issues.length} issue${issues.length !== 1 ? 's' : ''}`} 
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          {onExportExcel && (
            <Tooltip title="Export to Excel">
              <Button
                variant="contained"
                size="small"
                startIcon={<GetApp />}
                onClick={onExportExcel}
                sx={{ 
                  ml: 1,
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)'
                  }
                }}
              >
                Excel
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Issues Table */}
        <Box 
          sx={{
            maxHeight: '400px', // Limit height to show ~5 issues
            overflowY: 'auto',
            overflowX: 'hidden',
            // Custom scrollbar styles - hidden by default, visible on hover
            '&::-webkit-scrollbar': {
              width: '6px',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            },
            '&:hover::-webkit-scrollbar': {
              opacity: 1
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              '&:hover': {
                background: 'rgba(0,0,0,0.4)'
              }
            },
            // For Firefox
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
            '&:hover': {
              scrollbarColor: 'rgba(0,0,0,0.4) transparent'
            }
          }}
        >
          <List disablePadding>
            <AnimatePresence>
              {issues.map((issue, index) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => onSelectIssue(issue)}
                    sx={{ 
                      py: 2,
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        '& .arrow-icon': { 
                          transform: 'translateX(4px)',
                          color: 'primary.main'
                        }
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                        <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                          {issue.key.split('-')[0]}
                        </Typography>
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {issue.key}
                          </Typography>
                          {issue.fields.status && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getStatusIcon(issue.fields.status.name)}
                              <Typography variant="caption" color="text.secondary">
                                {issue.fields.status.name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.4 }}>
                            {issue.fields.summary}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            {issue.fields.priority && (
                              <Chip
                                label={issue.fields.priority.name}
                                size="small"
                                color={getPriorityColor(issue.fields.priority.name)}
                                variant="outlined"
                                icon={<Flag />}
                              />
                            )}
                            {showStoryPoints && issue.fields.storyPoints && (
                              <Chip
                                label={`${issue.fields.storyPoints} SP`}
                                size="small"
                                color="primary"
                                variant="filled"
                                icon={<Star />}
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                            {issue.fields.sprint && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Timeline sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {issue.fields.sprint.name}
                                </Typography>
                              </Box>
                            )}
                            {issue.fields.assignee && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {issue.fields.assignee.displayName}
                                </Typography>
                              </Box>
                            )}
                            {issue.fields.updated && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(issue.fields.updated)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <KeyboardArrowRight 
                      className="arrow-icon"
                      sx={{ 
                        color: 'action.active',
                        transition: 'all 0.2s ease-in-out'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
                {index < issues.length - 1 && <Divider />}
              </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Box>
      </Paper>
    </Fade>
  );
};

export default JiraIssueList;
