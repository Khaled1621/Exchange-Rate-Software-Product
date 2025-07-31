// Function to get the speech mode preference from localStorage
export const getReadModePreference = () => {
  const savedReadMode = localStorage.getItem('speechModePreference');
  // If user has previously set a preference, use it
  if (savedReadMode) {
    return savedReadMode === 'true';
  }
  // Default to false (speech off)
  return false;
};

// Function to save the speech mode preference to localStorage
export const saveReadModePreference = (isSpeechMode) => {
  localStorage.setItem('speechModePreference', isSpeechMode.toString());
};

// Function to get the speech rate preference from localStorage
export const getSpeechRate = () => {
  const savedRate = localStorage.getItem('speechRatePreference');
  // If user has previously set a preference, use it
  if (savedRate) {
    return parseFloat(savedRate);
  }
  // Default to 1 (normal speed)
  return 1;
};

// Function to save the speech rate preference to localStorage
export const saveSpeechRate = (rate) => {
  localStorage.setItem('speechRatePreference', rate.toString());
};

// Function to get the speech voice preference from localStorage
export const getSpeechVoice = () => {
  return localStorage.getItem('speechVoicePreference') || '';
};

// Function to save the speech voice preference to localStorage
export const saveSpeechVoice = (voiceName) => {
  localStorage.setItem('speechVoicePreference', voiceName);
};
