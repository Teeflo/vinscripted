// Popup script for Vinscripted

const languageSelect = document.getElementById('language');
const languageDisplay = document.getElementById('languageDisplay');
const messageDiv = document.getElementById('message');

// Language display names
const LANGUAGE_NAMES = {
  fr: 'Francais',
  en: 'English',
  de: 'Deutsch',
  es: 'Espanol',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Portugues'
};

// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings when language changes
languageSelect.addEventListener('change', saveSettings);

// Load settings from chrome.storage
function loadSettings() {
  chrome.storage.sync.get(['language'], (result) => {
    const lang = result.language || 'fr';
    languageSelect.value = lang;
    languageDisplay.textContent = LANGUAGE_NAMES[lang] || 'Francais';
  });
}

// Save settings to chrome.storage
function saveSettings() {
  const language = languageSelect.value;
  
  // Update display
  languageDisplay.textContent = LANGUAGE_NAMES[language] || language;
  
  chrome.storage.sync.set({ language }, () => {
    showMessage('Sauvegarde', 'success');
  });
}

// Show message to user
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;
  
  // Hide message after 2 seconds
  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 2000);
}
