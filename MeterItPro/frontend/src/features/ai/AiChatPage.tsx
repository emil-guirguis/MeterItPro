import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import apiClient from '../../services/apiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
}

const SUGGESTED_QUESTIONS = [
  'Which meters have not reported in the last 48 hours?',
  'What is my total energy consumption today?',
  'Are there any active alert rules that have triggered recently?',
  'Give me a summary of all my meters and their latest readings.',
];

export const AiChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    setInput('');
    setError(null);

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.post('/ai/chat', {
        message: userMessage,
        history,
      });

      if (res.data.success) {
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: res.data.response,
            toolsUsed: res.data.tools_used,
          },
        ]);
      } else {
        setError(res.data.message ?? 'An error occurred.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to reach the AI. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 80px)',
        maxWidth: 900,
        mx: 'auto',
        px: 2,
        py: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          AI Assistant (Zenith)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask questions about your meters, readings, and alerts.
        </Typography>
      </Box>

      {/* Messages area */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        {messages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: 'text.secondary',
            }}
          >
            <SmartToyIcon sx={{ fontSize: 56, opacity: 0.3 }} />
            <Typography variant="body1" textAlign="center">
              Ask anything about your facility's energy data.
            </Typography>
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={1}
              justifyContent="center"
              sx={{ maxWidth: 600 }}
            >
              {SUGGESTED_QUESTIONS.map((q) => (
                <Chip
                  key={q}
                  label={q}
                  onClick={() => sendMessage(q)}
                  variant="outlined"
                  clickable
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}

        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar icon */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.5,
              }}
            >
              {msg.role === 'user' ? (
                <PersonIcon sx={{ fontSize: 18, color: 'white' }} />
              ) : (
                <SmartToyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
            </Box>

            {/* Bubble */}
            <Box sx={{ maxWidth: '80%' }}>
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor:
                    msg.role === 'user' ? 'primary.light' : 'background.paper',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                  borderRadius:
                    msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body2" sx={{ color: 'inherit' }}>{msg.content}</Typography>
              </Paper>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <Stack direction="row" gap={0.5} flexWrap="wrap" mt={0.5}>
                  {[...new Set(msg.toolsUsed)].map((tool) => (
                    <Chip
                      key={tool}
                      label={tool.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SmartToyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Paper>
          </Box>
        )}

        {error && (
          <Box sx={{ px: 1 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Input bar */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask about your meters, readings, alerts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        />
        <IconButton
          color="primary"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
            mb: 0.25,
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
        Press Enter to send, Shift+Enter for a new line
      </Typography>
    </Box>
  );
};

export default AiChatPage;
