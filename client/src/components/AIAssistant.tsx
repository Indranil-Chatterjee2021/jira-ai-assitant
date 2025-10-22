import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  Fade,
  Slide
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  AutoAwesome,
  ContentCopy,
  Check,
  Chat
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  onSendPrompt: (prompt: string) => Promise<string>;
}

const AIAssistant: React.FC<Props> = ({ onSendPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your JIRA AI Assistant. I can help you analyze issues, generate JQL queries, and provide insights about your project. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const aiResponse = await onSendPrompt(prompt.trim());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };



  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Chat Header */}
      <Fade in timeout={300}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 56,
                height: 56,
                mr: 3,
              }}
            >
                              <SmartToy sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <AutoAwesome sx={{ mr: 1, color: 'warning.main' }} />
                AI Chat Assistant
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ask questions about JIRA issues, get JQL queries, and project insights
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Chat Messages */}
      <Paper sx={{ height: 500, mb: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    mb: 3,
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                      width: 36,
                      height: 36,
                      mx: 1,
                    }}
                  >
                    {message.type === 'user' ? <Person /> : <SmartToy />}
                  </Avatar>
                  
                  <Box sx={{ maxWidth: '75%' }}>
                    <Card
                      sx={{
                        bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                        color: message.type === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {message.content}
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1,
                        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                      {message.type === 'assistant' && (
                        <Tooltip title="Copy response">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <ContentCopy sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <Slide direction="up" in={isLoading} mountOnEnter unmountOnExit>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, mx: 1 }}>
                  <SmartToy />
                </Avatar>
                <Card sx={{ bgcolor: 'grey.100' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Slide>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
      </Paper>

      {/* Chat Input */}
      <Fade in timeout={500}>
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <TextField
                ref={textareaRef}
                fullWidth
                multiline
                maxRows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about JIRA issues, request JQL queries, or get project insights..."
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Chat color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !prompt.trim()}
                sx={{
                  minWidth: 48,
                  height: 48,
                  borderRadius: '50%',
                  p: 0,
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <Send />
                )}
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Press Enter to send, Shift+Enter for new line
              </Typography>
              <Chip
                label={`${prompt.length}/1000`}
                size="small"
                variant="outlined"
                color={prompt.length > 800 ? 'warning' : 'default'}
              />
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default AIAssistant;
