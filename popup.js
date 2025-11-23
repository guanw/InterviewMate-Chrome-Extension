// Popup script for InterviewMate Chrome Extension
// Handles UI interactions and communication with background script

document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const checkBtn = document.getElementById('checkBtn');
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const messageDiv = document.getElementById('message');

  let serverConnected = false;
  let currentTab = null;

  // Initialize popup
  initializePopup();

  async function initializePopup() {
    try {
      // Get current tab
      currentTab = await getCurrentTab();

      // Check if we're on Interview
      if (currentTab && currentTab.url.includes('leetcode.com')) {
        // Check server connection
        await checkServerConnection();
      } else {
        updateStatus('error', 'Please navigate to a Interview problem page');
        extractBtn.disabled = true;
      }

      // Set up event listeners
      setupEventListeners();

    } catch (error) {
      console.error('Error initializing popup:', error);
      updateStatus('error', 'Failed to initialize extension');
    }
  }

  function setupEventListeners() {
    extractBtn.addEventListener('click', extractQuestion);
    checkBtn.addEventListener('click', checkServerConnection);
  }

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function checkServerConnection() {
    updateStatus('connecting', 'Checking server connection...');

    try {
      const response = await sendMessageToBackground({ action: 'checkServer' });

      if (response && response.connected) {
        serverConnected = true;
        updateStatus('connected', '✅ Connected to InterviewMate app');
        extractBtn.disabled = false;
        hideMessage();
      } else {
        serverConnected = false;
        updateStatus('disconnected', '❌ Cannot connect to server');
        extractBtn.disabled = true;
        showMessage('Make sure the InterviewMate app is running on localhost:8080', 'error');
      }
    } catch (error) {
      console.error('Error checking server connection:', error);
      serverConnected = false;
      updateStatus('error', '⚠️ Error checking connection');
      extractBtn.disabled = true;
      showMessage('Connection check failed', 'error');
    }
  }

  async function extractQuestion() {
    if (!currentTab || !currentTab.url.includes('leetcode.com')) {
      showMessage('Please navigate to a Interview problem page', 'error');
      return;
    }

    if (!serverConnected) {
      showMessage('Server is not connected. Please check the connection first.', 'error');
      return;
    }

    try {
      extractBtn.disabled = true;
      extractBtn.textContent = '⏳ Extracting...';

      // Send extract message to content script
      const response = await sendMessageToTab(currentTab.id, { action: 'extract' });

      if (response && response.success) {
        showMessage('✅ Question extracted and sent to InterviewMate app!', 'success');
        updateStatus('connected', '✅ Question sent successfully');
      } else {
        const errorMsg = response ? response.error : 'Unknown error occurred';
        showMessage(`❌ Extraction failed: ${errorMsg}`, 'error');
        updateStatus('error', '⚠️ Extraction failed');
      }

    } catch (error) {
      console.error('Error extracting question:', error);
      showMessage(`❌ Extraction error: ${error.message}`, 'error');
      updateStatus('error', '⚠️ Extraction error');
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = '📤 Extract Question';
    }
  }

  function updateStatus(type, text) {
    statusDiv.className = `status ${type}`;
    statusText.textContent = text;
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(hideMessage, 5000);
    }
  }

  function hideMessage() {
    messageDiv.style.display = 'none';
  }

  function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Check server connection when popup opens
  setTimeout(checkServerConnection, 500);
});