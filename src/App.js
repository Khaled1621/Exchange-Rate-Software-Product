// React imports
import React, { useState, useEffect, useCallback, createContext } from 'react';

// Material UI imports
import { ThemeProvider, CssBaseline, Grid, Tooltip } from '@mui/material';
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon for dark mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon for light mode
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'; // Voice icon for speech mode
import VoiceOverOffIcon from '@mui/icons-material/VoiceOverOff'; // Voice off icon for normal mode
import { DataGrid } from '@mui/x-data-grid';

// Chart.js imports
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Local imports
import UserCredentialDialog from './UserCredentialsDialog/UserCredentialsDialog';
import ChangePassword from './ChangePassword/ChangePassword';
import StatisticsModal from './StatisticsModal/StatisticsModal';
import ChatbotModal from './ChatbotModal/ChatbotModal';
import { getUserToken, saveUserToken, clearUserToken } from './localStorage';
import { getThemePreference, saveThemePreference } from './themeStorage';
import { getReadModePreference, saveReadModePreference, getSpeechRate, saveSpeechRate, getSpeechVoice, saveSpeechVoice } from './readModeStorage';
import { lightTheme, darkTheme } from './theme';

// Styles
import './App.css';
import './darkMode.css';
import './readMode.css';

// Create a theme context to share theme mode across components
export const ThemeContext = createContext();

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

function decodeToken(token) {
  if (!token) return null;
  try {
    // JWT tokens are base64 encoded and have 3 parts separated by dots
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).sub;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

// Constants
const SERVER_URL = "http://127.0.0.1:5000";
const SERVER_URL_user = SERVER_URL + "/user";
const SERVER_URL_transaction = SERVER_URL + "/transaction";
const SERVER_URL_rate = SERVER_URL + "/rate";

function App() {
  // Theme state
  const [themeMode, setThemeMode] = useState(getThemePreference());
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Speech mode state
  const [readMode, setReadMode] = useState(getReadModePreference());
  const [speechRate, setSpeechRate] = useState(getSpeechRate());
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(getSpeechVoice());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsToSpeak, setWordsToSpeak] = useState([]);
  const [speechTextContainerRef, setSpeechTextContainerRef] = useState(null);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    saveThemePreference(newTheme);
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log('Speech synthesis available');
      setSpeechSynthesis(window.speechSynthesis);

      // Get available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        setAvailableVoices(voices);
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      loadVoices();

      // Test speech synthesis
      const testUtterance = new SpeechSynthesisUtterance('Testing speech synthesis');
      testUtterance.volume = 1;
      testUtterance.rate = 1;
      testUtterance.pitch = 1;
      window.speechSynthesis.speak(testUtterance);
    } else {
      console.error('Speech synthesis not available');
    }
  }, []);

  // Toggle speech mode function
  const toggleReadMode = () => {
    const newReadMode = !readMode;
    setReadMode(newReadMode);
    saveReadModePreference(newReadMode);

    if (newReadMode) {
      // Start reading the page content with a simple test first
      if (window.speechSynthesis) {
        console.log('Starting speech...');
        const testUtterance = new SpeechSynthesisUtterance('Text to speech mode activated');
        testUtterance.volume = 1;
        testUtterance.rate = 1;
        testUtterance.pitch = 1;
        testUtterance.onstart = () => console.log('Speech started');
        testUtterance.onend = () => {
          console.log('Test speech ended, starting content speech');
          speakPageContent();
        };
        testUtterance.onerror = (e) => console.error('Speech error:', e);
        window.speechSynthesis.speak(testUtterance);
      } else {
        console.error('Speech synthesis not available when toggling');
        alert('Speech synthesis is not available in your browser');
      }
    } else {
      // Stop reading
      if (window.speechSynthesis) {
        console.log('Stopping speech...');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        // Remove any speech text containers and highlights
        const container = document.querySelector('.speech-text-container');
        if (container) container.remove();

        const highlightedElements = document.querySelectorAll('.reading-highlight');
        highlightedElements.forEach(el => el.classList.remove('reading-highlight'));
      }
    }
  };

  // Create a ref for the speech text container
  const speechContainerRef = useCallback(node => {
    if (node !== null) {
      setSpeechTextContainerRef(node);
    }
  }, []);

  // Function to create and display the speech text container
  const createSpeechTextContainer = (text, parentElement) => {
    // Remove any existing container
    const existingContainer = document.querySelector('.speech-text-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create a new container
    const container = document.createElement('div');
    container.className = 'speech-text-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'assertive');

    // Split text into words and create spans for each word
    const words = text.split(/\s+/);
    setWordsToSpeak(words);
    setCurrentWordIndex(0);

    words.forEach((word, index) => {
      const wordSpan = document.createElement('span');
      wordSpan.textContent = word + ' ';
      wordSpan.dataset.index = index;
      container.appendChild(wordSpan);
    });

    // Add cursor element
    const cursor = document.createElement('span');
    cursor.className = 'speech-cursor';
    container.appendChild(cursor);

    // Add container to the parent element
    parentElement.appendChild(container);

    return { container, words };
  };

  // Function to update the cursor position
  const updateCursorPosition = (wordIndex) => {
    if (!speechTextContainerRef) return;

    // Remove current-word class from all words
    const allWords = speechTextContainerRef.querySelectorAll('span:not(.speech-cursor)');
    allWords.forEach(word => word.classList.remove('current-word'));

    // Add current-word class to current word
    const currentWord = speechTextContainerRef.querySelector(`span[data-index="${wordIndex}"]`);
    if (currentWord) {
      currentWord.classList.add('current-word');

      // Position cursor after current word
      const cursor = speechTextContainerRef.querySelector('.speech-cursor');
      if (cursor) {
        const rect = currentWord.getBoundingClientRect();
        cursor.style.left = `${rect.right - speechTextContainerRef.getBoundingClientRect().left}px`;
        cursor.style.top = `${rect.top - speechTextContainerRef.getBoundingClientRect().top}px`;

        // Scroll to keep current word visible
        currentWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Function to read page content
  const speakPageContent = (specificElement = null) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not available in speakPageContent');
      return;
    }

    console.log('Speaking page content...');

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Get content to read
    let contentToRead;
    if (specificElement) {
      contentToRead = specificElement;
    } else {
      contentToRead = document.querySelector('.content-container');
      if (!contentToRead) {
        console.error('No content to read');
        return;
      }
    }

    // Extract text content
    let textToRead = contentToRead.textContent;
    console.log('Text length:', textToRead.length);

    // Add a title if it's a specific element
    if (specificElement) {
      // Try to find a heading within the element
      const heading = specificElement.querySelector('h1, h2, h3, h4, h5, h6, .MuiTypography-h5, .MuiTypography-h6');
      if (heading) {
        textToRead = `${heading.textContent}. ${textToRead}`;
      }
    }

    // Clean up the text and limit length to avoid issues
    textToRead = textToRead.replace(/\s+/g, ' ').trim();
    if (textToRead.length > 1000) {
      console.log('Trimming long text');
      textToRead = textToRead.substring(0, 1000) + '... (content trimmed for speech)';
    }

    // Add visual highlight if it's a specific element
    if (specificElement) {
      specificElement.classList.add('reading-highlight');

      // Create speech text container with visual cursor
      const { container } = createSpeechTextContainer(textToRead, specificElement);
      setSpeechTextContainerRef(container);
    }

    // Use a simpler approach - read the entire text at once
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
      if (specificElement) {
        specificElement.classList.remove('reading-highlight');
        const container = document.querySelector('.speech-text-container');
        if (container) container.remove();
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsSpeaking(false);
      if (specificElement) {
        specificElement.classList.remove('reading-highlight');
        const container = document.querySelector('.speech-text-container');
        if (container) container.remove();
      }
    };

    console.log('Speaking utterance...');
    window.speechSynthesis.speak(utterance);
  };

  // Function to read a specific section when clicked
  const handleSectionClick = (event) => {
    if (!readMode || !speechSynthesis) return;

    // Find the closest section container
    const section = event.currentTarget.closest('.wrapper, .calculator-wrapper, .transaction-wrapper, .offers-wrapper');
    if (section) {
      speakPageContent(section);
    }
  };

  const [buyUsdRate, setBuyUsdRate] = useState(null);
  const [sellUsdRate, setSellUsdRate] = useState(null);
  const [lbpInput, setLbpInput] = useState("");
  const [usdInput, setUsdInput] = useState("");
  const [transactionType, setTransactionType] = useState("usd-to-lbp");
  const [transactionCount, setTransactionCount] = useState(0);
  const [userToken, setUserToken] = useState(getUserToken());
  const [userTransactions, setUserTransactions] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerCurrency, setOfferCurrency] = useState('usd');
  const [offerRate, setOfferRate] = useState('');
  const [offerEndDate, setOfferEndDate] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showUserOffersOnly, setShowUserOffersOnly] = useState(false);

  const fetchGraphData = useCallback(() => {
    fetch(`${SERVER_URL_rate}/graph`)
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Define chart colors as constants so they can be reused
  const usdToLbpColor = 'rgb(75, 192, 192)'; // Teal/mint color
  const lbpToUsdColor = 'rgb(255, 99, 132)'; // Pink/salmon color

  const getChartData = () => {
    if (!graphData) return null;

    return {
      labels: [...new Set([
        ...graphData.usd_to_lbp.map(t => t.date),
        ...graphData.lbp_to_usd.map(t => t.date)
      ])].sort(),
      datasets: [
        {
          label: 'USD to LBP Rate',
          data: graphData.usd_to_lbp.map(t => ({ x: t.date, y: t.rate })),
          borderColor: usdToLbpColor,
          backgroundColor: usdToLbpColor,
          tension: 0.1
        },
        {
          label: 'LBP to USD Rate',
          data: graphData.lbp_to_usd.map(t => ({ x: t.date, y: t.rate })),
          borderColor: lbpToUsdColor,
          backgroundColor: lbpToUsdColor,
          tension: 0.1
        }
      ]
    };
  };

  const fetchUserTransactions = useCallback(() => {
    fetch(`${SERVER_URL_transaction}/`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => res.json())
      .then(tx => setUserTransactions(tx))
      .catch(err => console.error(err));
  }, [userToken]);

  useEffect(() => {
    if (userToken) fetchUserTransactions();
  }, [fetchUserTransactions]);

  const fetchOffers = useCallback(() => {
    fetch(`${SERVER_URL_transaction}/offer`)
      .then(res => res.json())
      .then(data => setOffers(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchOffers();
    const interval = setInterval(fetchOffers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchOffers]);

  const createOffer = () => {
    if (!offerAmount || !offerRate || !offerEndDate) {
      alert("Please fill in all fields");
      return;
    }

    // Convert strings to proper number types
    const amount = parseFloat(offerAmount);
    const rate = parseFloat(offerRate);
    const isUsd = offerCurrency === 'true'; // Convert to actual boolean

    // Validate numbers
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      alert("Please enter a valid rate");
      return;
    }

    // Validate and format date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offerEndDate)) {
      alert("Please enter date in YYYY-MM-DD format");
      return;
    }

    const payload = {
      amount: amount,  // This will be a float
      rate: rate,     // This will be a float
      usd: isUsd,     // This will be a boolean
      end_date: offerEndDate
    };

    console.log('Sending payload:', payload);

    fetch(`${SERVER_URL_transaction}/offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(payload)
    })
      .then(async response => {
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          try {
            const errorData = JSON.parse(responseText);
            throw errorData;
          } catch (e) {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        return JSON.parse(responseText);
      })
      .then(data => {
        alert('Offer created successfully!');
        setShowOfferForm(false);
        setOfferAmount('');
        setOfferCurrency('');
        setOfferRate('');
        setOfferEndDate('');
        fetchOffers();
      })
      .catch(error => {
        console.error('Error:', error);
        alert(error.error || 'Failed to create offer');
      });
  };

  const States = {
    PENDING: "pending",
    USER_CREATION: "USER_CREATION",
    USER_LOG_IN: "USER_LOG_IN",
    USER_AUTHENTICATED: "USER_AUTHENTICATED",
    USER_CHANGE_PASSWORD: "CHANGE_PASSWORD",
    PASSWORD_CHANGED: "PASSWORD_CHANGED",
    LOGIN_ERROR: "LOGIN_ERROR"
  };
  const [authState, setAuthState] = useState(States.PENDING);
  const maxTransactions = 10;

  // calculator
  const [calcAmount, setCalcAmount] = useState('');
  const [calcDirection, setCalcDirection] = useState('usd-to-lbp');
  const [calcResult, setCalcResult] = useState(null);

  function fetchRates() {
    fetch(`${SERVER_URL_rate}/exchange_rate`)
      .then(r => r.json())
      .then(data => {
        setBuyUsdRate(data.lbp_to_usd ?? null);
        setSellUsdRate(data.usd_to_lbp ?? null);
      })
      .catch(console.error);
  }
  useEffect(fetchRates, []);

  function handleCalculate() {
    const amt = parseFloat(calcAmount);
    if (isNaN(amt)) return alert('Enter a valid number');
    const rate = calcDirection === 'usd-to-lbp' ? buyUsdRate : sellUsdRate;
    if (rate == null) return alert('Rates not available yet');
    setCalcResult(amt * rate);
  }

  function addItem() {
    if (transactionCount >= maxTransactions) {
      alert("Too many transactions! Please wait a minute.");
      return;
    }
    const lbp = parseFloat(lbpInput),
          usd = parseFloat(usdInput);
    if (isNaN(lbp) || isNaN(usd)) {
      alert("Please enter valid numbers");
      return;
    }

    const payload = {
      usd_amount: usd,
      lbp_amount: lbp,
      usd_to_lbp: transactionType === "usd-to-lbp"
    };
    const headers = { "Content-Type": "application/json" };
    if (userToken) headers.Authorization = `Bearer ${userToken}`;

    fetch(`${SERVER_URL_transaction}/`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) alert(data.error);
        else {
          fetchRates();
          fetchUserTransactions();
          setTransactionCount(c => c + 1);
        }
      })
      .catch(console.error);

    setLbpInput(""); setUsdInput(""); setTransactionType("usd-to-lbp");
  }

  function login(u, p) {
    return fetch(`${SERVER_URL_user}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: u, password: p })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      })
      .then(b => {
        saveUserToken(b.token);
        setUserToken(b.token);
        setAuthState(States.USER_AUTHENTICATED);
      })
      .catch(err => {
        console.error("Login failed:", err);
        setAuthState(States.LOGIN_ERROR);
      });
  }

  function changePassword(oldPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match");
      return;
    }

    return fetch(`${SERVER_URL_user}/change_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    })
    .then(response => {
      if (!response.ok)
        return response.json().then(err => Promise.reject(err));
      setAuthState(States.PASSWORD_CHANGED);
    })
    .catch(err => {
      console.error("Password change failed:", err);
      alert(err.error || "Failed to change password");
    });
  }


  function createUser(u, p) {
    return fetch(`${SERVER_URL_user}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: u, password: p })
    }).then(() => login(u, p));
  }
  function logout() {
    clearUserToken();
    setUserToken(null);
    setAuthState(States.PENDING);
  }

  const fetchPrediction = useCallback(() => {
    fetch(`${SERVER_URL_rate}/predict`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        // Check if the response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response was not JSON");
        }
        return res.json();
      })
      .then(data => setPrediction(data.predicted_rate))
      .catch(err => {
        console.error('Error fetching prediction:', err);
        setPrediction(null); // Reset prediction on error
      });
  }, []);

  useEffect(() => {
    fetchRates();
    fetchGraphData();
    fetchPrediction();
  }, [fetchGraphData, fetchPrediction]);

  const deleteOffer = (offerId) => {
    fetch(`${SERVER_URL_transaction}/offer/${offerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    })
      .then(res => {
        if (res.ok) {
          fetchOffers();      // Refresh offers list
          alert('Offer deleted successfully');
        } else {
          return res.json().then(err => Promise.reject(err));
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert(error.error || 'Failed to delete offer');
      });
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, readMode, toggleReadMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={`${themeMode === 'dark' ? 'dark-theme' : 'light-theme'}`}>
        <AppBar position="static" sx={{
        boxShadow: themeMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1)' : '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 0, 0, 0.1)',
        border: themeMode === 'dark' ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '0 0 10px 10px',
        position: 'relative',
        zIndex: 10
      }}>
        <Toolbar className={`nav ${themeMode === 'dark' ? 'dark-mode-navbar' : ''}`} sx={{
          padding: '8px 16px',
          '& .MuiButton-root': {
            margin: '0 4px',
            borderRadius: '4px',
            textTransform: 'none',
            fontWeight: 500
          }
        }}>
          <Typography variant="h5" sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            padding: '4px 0'
          }}>
            LBP Exchange Tracker
          </Typography>
          <Button color="inherit" onClick={() => setShowStats(true)} sx={{ fontWeight: 'medium', px: 2 }}>Statistics</Button>
          <Button color="inherit" onClick={() => setShowChatbot(true)} sx={{ fontWeight: 'medium', px: 2 }}>Chat</Button>
          <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
              {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={`${readMode ? 'Stop' : 'Start'} text-to-speech`}>
            <IconButton
              color={isSpeaking ? "secondary" : "inherit"}
              onClick={toggleReadMode}
              sx={{
                ml: 1,
                animation: isSpeaking ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                  '100%': { opacity: 1 }
                }
              }}
              disabled={!speechSynthesis}
            >
              {readMode ? <VoiceOverOffIcon /> : <RecordVoiceOverIcon />}
            </IconButton>
          </Tooltip>
          {userToken ? (
            <>
              <Button color="inherit" onClick={() => setAuthState(States.USER_CHANGE_PASSWORD)} sx={{ fontWeight: 'medium', px: 2 }}>Change Password</Button>
              <Button color="inherit" onClick={logout} sx={{ fontWeight: 'medium', px: 2 }}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setAuthState(States.USER_CREATION)} sx={{ fontWeight: 'medium', px: 2 }}>Register</Button>
              <Button color="inherit" onClick={() => setAuthState(States.USER_LOG_IN)} sx={{ fontWeight: 'medium', px: 2 }}>Login</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

        <UserCredentialDialog
        open={authState === States.USER_CREATION}
        onClose={() => setAuthState(States.PENDING)}
        onSubmit={({ username, password }) => createUser(username, password)}
        title="Create Account"
        submitText="Register"
      />
        <UserCredentialDialog
        open={authState === States.USER_LOG_IN}
        onClose={() => setAuthState(States.PENDING)}
        onSubmit={({ username, password }) => login(username, password)}
        title="Login"
        submitText="Login"
      />
        <ChangePassword
        open={authState === States.USER_CHANGE_PASSWORD}
        onClose={() => setAuthState(States.PENDING)}
        onSubmit={({ oldPassword, newPassword, confirmPassword }) => {
          if (!userToken) {
            alert("You must be logged in to change your password");
            return;
          }
          return changePassword(oldPassword, newPassword, confirmPassword);
        }}
        title="Change Password"
        submitText="Change Password"
      />
        <StatisticsModal
        open={showStats}
        onClose={() => setShowStats(false)}
      />
        <ChatbotModal
        open={showChatbot}
        onClose={() => setShowChatbot(false)}
      />

        <Snackbar
        elevation={6}
        variant="filled"
        open={authState === States.USER_AUTHENTICATED}
        autoHideDuration={2000}
        onClose={() => setAuthState(States.PENDING)}
      >
        <Alert severity="success">Success</Alert>
      </Snackbar>

        <Snackbar
        elevation={6}
        variant="filled"
        open={authState === States.PASSWORD_CHANGED}
        autoHideDuration={2000}
        onClose={() => setAuthState(States.PENDING)}
      >
        <Alert severity="success">Password Changed Successfully!</Alert>
      </Snackbar>

        <Snackbar
        elevation={6}
        variant="filled"
        open={authState === States.LOGIN_ERROR}
        autoHideDuration={2000}
        onClose={() => setAuthState(States.PENDING)}
      >
        <Alert severity="error">Invalid username or password</Alert>
      </Snackbar>

        <Snackbar
        elevation={6}
        variant="filled"
        open={isSpeaking}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" icon={<RecordVoiceOverIcon />}>
          Text-to-speech is active. Click the voice icon to stop or click on a section to read it.
        </Alert>
      </Snackbar>

        <div className="header" style={{
        backgroundColor: themeMode === 'dark' ? '#1a1a2e' : theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          marginTop: '20px'
        }}>
          {/* Current Exchange Rate Box */}
          <div style={{
            backgroundColor: themeMode === 'dark' ? theme.palette.background.exchangeCard : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: themeMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.2)',
            border: themeMode === 'dark' ? '1px solid #2c3e50' : '1px solid #d0d0d0',
            minWidth: '300px',
            flex: '1',
            maxWidth: '400px'
          }}>
            <Typography variant="h5" style={{
              color: themeMode === 'dark' ? theme.palette.text.accent : '#0066cc',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Today's Exchange Rate
            </Typography>
            <Typography variant="h6" style={{
              color: themeMode === 'dark' ? theme.palette.text.accent : '#0066cc',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              LBP → USD Exchange Rate
            </Typography>
            <div style={{
              backgroundColor: themeMode === 'dark' ? theme.palette.background.exchangeHighlight : '#e1f0ff',
              padding: '15px',
              borderRadius: '8px',
              border: themeMode === 'dark' ? '1px solid #3a506b' : '1px solid #99ccff',
            }}>
              <Typography style={{
                fontSize: '1.2em',
                marginBottom: '8px',
                textAlign: 'center',
                color: themeMode === 'dark' ? theme.palette.text.primary : '#003366'
              }}>
                <strong>Buy USD:</strong> {buyUsdRate != null ? buyUsdRate.toFixed(2) : "—"}
              </Typography>
              <Typography style={{
                fontSize: '1.2em',
                textAlign: 'center',
                color: themeMode === 'dark' ? theme.palette.text.primary : '#003366'
              }}>
                <strong>Sell USD:</strong> {sellUsdRate != null ? sellUsdRate.toFixed(2) : "—"}
              </Typography>
            </div>
          </div>

          {/* AI Prediction Box */}
          <div style={{
            backgroundColor: themeMode === 'dark' ? theme.palette.background.exchangeCard : '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: themeMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.2)',
            border: themeMode === 'dark' ? '1px solid #2c3e50' : '1px solid #d0d0d0',
            minWidth: '300px',
            flex: '1',
            maxWidth: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: themeMode === 'dark' ? '1px solid #3a506b' : '1px solid #99ccff',
              paddingBottom: '10px',
              justifyContent: 'center'
            }}>
              <TrendingUpIcon style={{ color: themeMode === 'dark' ? theme.palette.text.accent : '#0066cc', marginRight: '10px' }} />
              <Typography variant="h6" style={{ color: themeMode === 'dark' ? theme.palette.text.accent : '#0066cc' }}>
                AI Rate Prediction
              </Typography>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: themeMode === 'dark' ? theme.palette.background.exchangeHighlight : '#e1f0ff',
              borderRadius: '8px',
              marginBottom: '10px',
              border: themeMode === 'dark' ? '1px solid #3a506b' : '1px solid #99ccff'
            }}>
              <Typography variant="body1">
                {prediction ? (
                  <span style={{
                    color: themeMode === 'dark' ? theme.palette.text.primary : '#003366',
                    fontSize: '1.2em',
                    display: 'block',
                    textAlign: 'center'
                  }}>
                    {prediction.toFixed(2)} LBP
                    <Tooltip title="This prediction is generated using machine learning based on historical data">
                      <IconButton size="small" style={{ marginLeft: '4px' }}>
                        <InfoIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </span>
                ) : (
                  <span style={{
                    color: themeMode === 'dark' ? '#a0a0a0' : '#4d4d4d',
                    fontStyle: 'italic',
                    display: 'block',
                    textAlign: 'center'
                  }}>
                    Currently unavailable
                  </span>
                )}
              </Typography>
            </div>

            <Typography
              variant="caption"
              style={{
                color: themeMode === 'dark' ? theme.palette.text.secondary : '#333333',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              <AutoGraphIcon fontSize="small" style={{ color: themeMode === 'dark' ? theme.palette.text.secondary : '#333333' }} />
              Prediction based on historical trends using LSTM model
            </Typography>
          </div>
        </div>
      </div>

        <div className="content-container" style={{ backgroundColor: themeMode === 'dark' ? '#1a1a2e' : '#e9ebf0' }}>
        {/* Calculator and Transaction Row */}
        <div className="calculator-transaction-row">
        {/* Currency Calculator Section */}
        <div className="calculator-section">
          <div className="calculator-wrapper" onClick={readMode ? handleSectionClick : undefined} style={{
              backgroundColor: theme.palette.background.card,
              boxShadow: theme.components.MuiPaper.styleOverrides.root.boxShadow,
              color: theme.palette.text.primary
            }}>
            <Typography variant="h6" gutterBottom>Currency Calculator</Typography>
            <div className="calculator-controls">
              <TextField
                label="Amount" type="number" size="small"
                value={calcAmount} onChange={e => setCalcAmount(e.target.value)}
                className={themeMode === 'dark' ? 'dark-mode-input' : ''}
              />
              <FormControl size="small">
                <InputLabel>Direction</InputLabel>
                <Select
                  value={calcDirection} label="Direction"
                  onChange={e => setCalcDirection(e.target.value)}
                >
                  <MenuItem value="usd-to-lbp">USD → LBP</MenuItem>
                  <MenuItem value="lbp-to-usd">LBP → USD</MenuItem>
                </Select>
              </FormControl>
              <IconButton color="primary" onClick={handleCalculate}>
                <SwapHorizIcon />
              </IconButton>
            </div>
            {calcResult != null && (
              <Typography className="result">
                Result: {calcResult.toFixed(2)} {calcDirection === 'usd-to-lbp' ? 'LBP' : 'USD'}
              </Typography>
            )}
          </div>
        </div>

        {/* Record Transaction Section */}
        <div className="transaction-section">
          <div className="transaction-wrapper" onClick={readMode ? handleSectionClick : undefined} style={{
              backgroundColor: theme.palette.background.card,
              boxShadow: theme.components.MuiPaper.styleOverrides.root.boxShadow,
              color: theme.palette.text.primary
            }}>
            <Typography variant="h6" gutterBottom>Record a Transaction</Typography>
            <FormControl fullWidth margin="dense">
              <TextField
                label="LBP Amount" type="number"
                value={lbpInput} onChange={e => setLbpInput(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth margin="dense">
              <TextField
                label="USD Amount" type="number"
                value={usdInput} onChange={e => setUsdInput(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={transactionType} label="Transaction Type"
                onChange={e => setTransactionType(e.target.value)}
              >
                <MenuItem value="usd-to-lbp">USD → LBP</MenuItem>
                <MenuItem value="lbp-to-usd">LBP → USD</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained" color="primary"
              sx={{ mt: 2 }}
              onClick={addItem}
            >
              Add
            </Button>
          </div>
        </div>
        </div> {/* End of calculator-transaction-row */}

        {/* Exchange Rate Trends */}
        <div className="content-container" style={{ backgroundColor: themeMode === 'dark' ? '#1a1a2e' : '#e9ebf0' }}>
          <div className="wrapper" onClick={readMode ? handleSectionClick : undefined} style={{
              backgroundColor: theme.palette.background.card,
              boxShadow: theme.components.MuiPaper.styleOverrides.root.boxShadow,
              color: theme.palette.text.primary
            }}>
            <Typography variant="h6" gutterBottom>Exchange Rate Trends</Typography>
            <hr />
            <div className={`chart-container ${themeMode === 'dark' ? 'dark-mode-chart' : ''}`}>
              {graphData && (
                <Line
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Exchange Rate Over Time'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        title: {
                          display: true,
                          text: 'Exchange Rate'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Exchange Offers Section */}
        <div className="offers-section">
          <div className="offers-wrapper" onClick={readMode ? handleSectionClick : undefined} style={{
              backgroundColor: theme.palette.background.card,
              boxShadow: theme.components.MuiPaper.styleOverrides.root.boxShadow,
              color: theme.palette.text.primary
            }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <Typography variant="h6" style={{
                color: themeMode === 'dark' ? theme.palette.text.primary : '#333',
                borderBottom: `2px solid ${usdToLbpColor}`,
                paddingBottom: '5px',
                display: 'inline-block'
              }}>Exchange Offers</Typography>
              {userToken && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowUserOffersOnly(!showUserOffersOnly)}
                    sx={{
                      borderColor: lbpToUsdColor,
                      color: lbpToUsdColor,
                      '&:hover': {
                        borderColor: lbpToUsdColor,
                        backgroundColor: `${lbpToUsdColor}22`
                      }
                    }}
                  >
                    {showUserOffersOnly ? 'Show All Offers' : 'My Offers'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setShowOfferForm(!showOfferForm)}
                    sx={{
                      backgroundColor: usdToLbpColor,
                      '&:hover': {
                        backgroundColor: `${usdToLbpColor}dd`
                      }
                    }}
                  >
                    {showOfferForm ? 'Cancel' : 'Create New Offer'}
                  </Button>
                </div>
              )}
            </div>

            {/* Offer Creation Form */}
            {showOfferForm && userToken && (
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: themeMode === 'dark' ? theme.palette.background.exchangeHighlight : '#f8f9fa',
                borderRadius: '8px',
                border: themeMode === 'dark' ? '1px solid #3a506b' : 'none'
              }}>
                <Typography variant="h6" gutterBottom>Create New Offer</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="USD (true/false)"
                      type="text"
                      value={offerCurrency}
                      onChange={(e) => setOfferCurrency(e.target.value.toLowerCase())}
                      helperText="Enter 'true' for USD, 'false' for LBP"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rate"
                      type="number"
                      value={offerRate}
                      onChange={(e) => setOfferRate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Date (YYYY-MM-DD)"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={offerEndDate}
                      onChange={(e) => setOfferEndDate(e.target.value)}
                      helperText="Format: YYYY-MM-DD (e.g., 2025-12-12)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={createOffer}
                      sx={{
                        backgroundColor: usdToLbpColor,
                        '&:hover': {
                          backgroundColor: `${usdToLbpColor}dd`
                        }
                      }}
                    >
                      Create Offer
                    </Button>
                  </Grid>
                </Grid>
              </div>
            )}

            {/* Offers Table */}
            <DataGrid
              autoHeight
              pageSize={5}
              rowsPerPageOptions={[5]}
              className={themeMode === 'dark' ? 'MuiDataGrid-root--darkMode' : ''}
              rows={offers
                .filter(offer => !showUserOffersOnly || (userToken && offer.user_id === parseInt(decodeToken(userToken))))
                .map((offer, i) => ({
                  id: offer.id ?? i,
                  amount: `${offer.amount.toLocaleString()} ${offer.usd ? 'USD' : 'LBP'}`,
                  rate: `${offer.rate.toLocaleString()} LBP/USD`,
                  total: offer.usd
                    ? `${(offer.amount * offer.rate).toLocaleString()} LBP`
                    : `${(offer.amount / offer.rate).toLocaleString()} USD`,
                  expires: new Date(offer.end_date).toLocaleDateString(),
                  actions: offer.user_id === parseInt(decodeToken(userToken)) ? offer.id : null
                }))}
              columns={[
                { field: 'amount', headerName: 'Amount', flex: 1, minWidth: 150 },
                { field: 'rate', headerName: 'Rate', flex: 1, minWidth: 150 },
                { field: 'total', headerName: 'Total', flex: 1, minWidth: 150 },
                { field: 'expires', headerName: 'Valid Until', flex: 1, minWidth: 130 },
                ...(userToken ? [{
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 1,
                  minWidth: 100,
                  renderCell: (params) => params.value ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this offer?')) {
                          deleteOffer(params.value);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: lbpToUsdColor,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: `${lbpToUsdColor}dd`
                        }
                      }}
                    >
                      Delete
                    </Button>
                  ) : null
                }] : [])
              ]}
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: themeMode === 'dark' ? 'rgba(75, 192, 192, 0.15)' : `${usdToLbpColor}33`,
                  fontWeight: 'bold',
                  color: themeMode === 'dark' ? theme.palette.text.primary : '#333'
                },
                border: 'none',
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: themeMode === 'dark' ? 'rgba(255, 99, 132, 0.1)' : `${lbpToUsdColor}15`
                },
                '& .MuiDataGrid-row:nth-of-type(even)': {
                  backgroundColor: themeMode === 'dark' ? 'rgba(75, 192, 192, 0.08)' : `${usdToLbpColor}15`
                }
              }}
            />
          </div>
        </div>



      </div>

      {userToken && (
        <div className="wrapper" style={{
            backgroundColor: theme.palette.background.card,
            boxShadow: theme.components.MuiPaper.styleOverrides.root.boxShadow,
            color: theme.palette.text.primary
          }}>
          <Typography variant="h5" gutterBottom style={{
            color: theme.palette.text.primary,
            borderBottom: `2px solid ${usdToLbpColor}`,
            paddingBottom: '5px',
            display: 'inline-block'
          }}>Your Transactions</Typography>
          <DataGrid
            autoHeight pageSize={5} rowsPerPageOptions={[5]}
            className={themeMode === 'dark' ? 'MuiDataGrid-root--darkMode' : ''}
            rows={userTransactions.map((t, i) => ({
              id: t.id ?? i,
              usd_amount: t.usd_amount,
              lbp_amount: t.lbp_amount,
              direction: t.usd_to_lbp ? 'USD → LBP' : 'LBP → USD'
            }))}
            columns={[
              { field: 'id',        headerName: 'ID',         width: 70 },
              { field: 'usd_amount', headerName: 'USD Amount', width: 130 },
              { field: 'lbp_amount', headerName: 'LBP Amount', width: 130 },
              { field: 'direction',  headerName: 'Direction',  width: 150 }
            ]}
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '0.9rem',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: themeMode === 'dark' ? 'rgba(75, 192, 192, 0.15)' : `${usdToLbpColor}33`,
                fontWeight: 'bold',
                color: themeMode === 'dark' ? theme.palette.text.primary : '#333'
              },
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: themeMode === 'dark' ? 'rgba(255, 99, 132, 0.1)' : `${lbpToUsdColor}15`
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: themeMode === 'dark' ? 'rgba(75, 192, 192, 0.08)' : `${usdToLbpColor}15`
              }
            }}
          />
        </div>
      )}
        </div>
    </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;
