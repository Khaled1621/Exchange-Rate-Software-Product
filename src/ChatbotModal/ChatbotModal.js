import React, { useContext } from 'react';
import Chatbot from '../Chatbot/Chatbot';
import './ChatbotModal.css';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { ThemeContext } from '../App';

function ChatbotModal({ open, onClose }) {
  const { themeMode } = useContext(ThemeContext);
  const isDarkMode = themeMode === 'dark';

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className={`chatbot-modal ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className={`chatbot-header ${isDarkMode ? 'dark-mode' : ''}`}>
          <span className="chat-icon">💬</span>
          <h2>Exchange Rate Assistant</h2>
          <IconButton
            className="close-icon-button"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </div>
        <div className={`chatbot-content ${isDarkMode ? 'dark-mode' : ''}`}>
          <Chatbot simplified={true} />
        </div>
      </div>
    </div>
  );
}

export default ChatbotModal;
