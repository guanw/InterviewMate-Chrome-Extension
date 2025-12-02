// Background script for InterviewMate Chrome Extension
// Handles communication between content script and server

// Constants (shared with other extension scripts via constants.js)
const ACTION_EXECUTE_IN_PAGE = 'executeInPage';
const ACTION_EXTRACT_QUESTION = 'extractQuestion';
const ACTION_CHECK_SERVER = 'checkServer';
const ACTION_TEST = 'test';
const SERVER_URL = 'http://localhost:8080';

// Debug: Background script loaded
console.log('🚀 InterviewMate Background Script Loaded');
console.log('🔍 Extension ID:', chrome.runtime.id);

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received message:', {
    action: request.action,
    sender: sender.tab ? sender.tab.url : 'popup',
    timestamp: new Date().toISOString()
  });

  if (request.action === ACTION_EXTRACT_QUESTION) {
    // Send extracted data to the server
    sendExtractedData(request.data)
      .then(response => {
        console.log('Data sent to server:', response);
        sendResponse({ success: true, message: 'Question sent to InterviewMate app' });
      })
      .catch(error => {
        console.error('Error sending data to server:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === ACTION_CHECK_SERVER) {
    // Check if server is reachable
    checkServerConnection()
      .then(isConnected => {
        sendResponse({ connected: isConnected });
      })
      .catch(error => {
        console.error('Error checking server:', error);
        sendResponse({ connected: false, error: error.message });
      });
    return true;
  }

  if (request.action === ACTION_EXECUTE_IN_PAGE) {
    // Execute code in the page's main world
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: "MAIN",
      function: () => {
        if (window.monaco) {
          const m = window.monaco.editor.getModels();
          if (m && m.length) return m[0].getValue();
        }
        if (window.editor?.getValue) return window.editor.getValue();
        if (window.padEditor?.getValue) return window.padEditor.getValue();
        return null;
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Script execution error:', chrome.runtime.lastError);
        sendResponse(null);
      } else {
        sendResponse(results[0].result);
      }
    });
    return true;
  }

  if (request.action === ACTION_TEST) {
    // Debug test message
    console.log('✅ Background test message received successfully');
    sendResponse({
      success: true,
      message: 'Background script is working!',
      timestamp: new Date().toISOString(),
      extensionId: chrome.runtime.id
    });
    return true;
  }

  // Default response for unknown actions
  console.log('⚠️ Unknown action received:', request.action);
  sendResponse({ success: false, error: 'Unknown action' });
});

// Function to send extracted data to the server
async function sendExtractedData(data) {
  try {
    const response = await fetch(`${SERVER_URL}/api/interview-question-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        extensionId: chrome.runtime.id,
        data
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send data to server:', error);
    throw error;
  }
}

// Function to check server connectivity
async function checkServerConnection() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log('Server connection failed:', error.message);
    return false;
  }
}

// Initialize background script
console.log('InterviewMate background script loaded');