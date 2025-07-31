import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, TextField, IconButton, Typography, Box, Avatar,
  CircularProgress, Tooltip, InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ChatIcon from '@mui/icons-material/Chat';

const Chatbot = ({ simplified = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId.current,
          previous_messages: messages
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(data.previous_messages);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: simplified ? 'center' : 'flex-start',
          gap: simplified ? 0.8 : 1.5,
          mb: simplified ? 1.5 : 2.5,
          flexDirection: isUser ? 'row-reverse' : 'row'
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? '#4ba6de' : '#005b96',
            width: simplified ? 28 : 36,
            height: simplified ? 28 : 36,
            boxShadow: 'none',
            fontSize: simplified ? '0.8rem' : '1rem',
            color: 'white'
          }}
        >
          {isUser ? 'U' : <CurrencyExchangeIcon fontSize={simplified ? "small" : "medium"} />}
        </Avatar>
        <Paper
          elevation={simplified ? 0 : 2}
          sx={{
            p: simplified ? 1.2 : 2,
            maxWidth: simplified ? '75%' : '75%',
            bgcolor: isUser ? '#e1f0ff' : '#ffffff',
            borderRadius: simplified ? '16px' : 3,
            border: simplified
              ? (isUser ? '1px solid #b8dcff' : '1px solid #e0e0e0')
              : (isUser ? '1px solid #99ccff' : '1px solid #d0d0d0'),
            boxShadow: simplified ? 'none' : '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: isUser ? '#003366' : '#333333',
              whiteSpace: 'pre-wrap',
              fontWeight: message.role === 'bot' ? 400 : 500,
              fontSize: simplified ? '0.95rem' : '1rem'
            }}
          >
            {message.content}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Paper
      elevation={simplified ? 0 : 3}
      sx={{
        p: 0,
        maxWidth: simplified ? '100%' : 700,
        margin: 'auto',
        height: simplified ? '500px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: simplified ? 0 : 2,
        overflow: 'hidden',
        border: simplified ? 'none' : '1px solid #d0d0d0',
        boxShadow: simplified ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {!simplified && (
        <Box sx={{
          p: 2,
          bgcolor: '#3da0d9',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <ChatIcon />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Exchange Rate Assistant
          </Typography>
        </Box>
      )}

      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        mb: simplified ? 0 : 2,
        p: simplified ? 2 : 3,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: simplified ? '#f5f9fc' : '#f8fbff'
      }}>
        {messages.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.7
          }}>
            {simplified ? (
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRiYTZkZSIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMS40MSA0LjQxYy43OC0uNzggMi4wNS0uNzggMi44MyAwIC43OC43OC43OCAyLjA1IDAgMi44M2wtLjAxLjAxYy0uNzguNzgtMi4wNS43OC0yLjgzIDAtLjc4LS43OC0uNzgtMi4wNC4wMS0yLjg0em0tNC43MSA0LjcyYy43OC0uNzggMi4wNS0uNzggMi44MyAwIC43OC43OC43OCAyLjA1IDAgMi44M2wtLjAxLjAxYy0uNzguNzgtMi4wNS43OC0yLjgzIDAtLjc4LS43OC0uNzgtMi4wNS4wMS0yLjg0em0yLjMgNi44N2MtLjc4Ljc4LTIuMDUuNzgtMi44MyAwLS43OC0uNzgtLjc4LTIuMDUgMC0yLjgzbC4wMS0uMDFjLjc4LS43OCAyLjA1LS43OCAyLjgzIDAgLjc4Ljc4Ljc4IDIuMDUtLjAxIDIuODR6bTQuNzEtNC43MmMtLjc4Ljc4LTIuMDUuNzgtMi44MyAwLS43OC0uNzgtLjc4LTIuMDUgMC0yLjgzbC4wMS0uMDFjLjc4LS43OCAyLjA1LS43OCAyLjgzIDAgLjc4Ljc4Ljc4IDIuMDUtLjAxIDIuODR6Ii8+PC9zdmc+"
                alt="Exchange Icon"
                style={{ width: 48, height: 48, marginBottom: '16px' }}
              />
            ) : (
              <CurrencyExchangeIcon sx={{ fontSize: 48, color: '#3da0d9', mb: 2 }} />
            )}
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: simplified ? '#4ba6de' : '#005b96',
                fontWeight: 500
              }}
            >
              Ask me anything about LBP to USD exchange rates!
            </Typography>
          </Box>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} sx={{ color: '#4ba6de' }} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{
        p: simplified ? 1.5 : 2,
        borderTop: '1px solid #e0e0e0',
        bgcolor: 'white'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about exchange rates..."
            disabled={isLoading}
            variant="outlined"
            size="small"
            InputProps={{
              // Using InputProps despite deprecation warning as it's still the recommended way in MUI v5
              startAdornment: simplified ? null : (
                <InputAdornment position="start">
                  <ChatIcon fontSize="small" sx={{ color: '#3da0d9' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: simplified ? 20 : 2,
                '&.Mui-focused fieldset': {
                  borderColor: '#4ba6de',
                },
                '&:hover fieldset': {
                  borderColor: '#4ba6de',
                },
              }
            }}
          />
          <Tooltip title="Send message">
            <IconButton
              type="submit"
              disabled={isLoading || !input.trim()}
              sx={{
                bgcolor: '#4ba6de',
                color: 'white',
                borderRadius: simplified ? '50%' : undefined,
                width: simplified ? 36 : undefined,
                height: simplified ? 36 : undefined,
                minWidth: simplified ? 36 : undefined,
                '&:hover': {
                  bgcolor: '#005b96',
                },
                '&.Mui-disabled': {
                  bgcolor: '#e0e0e0',
                }
              }}
            >
              <SendIcon fontSize={simplified ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </form>
      </Box>
    </Paper>
  );
};

export default Chatbot;