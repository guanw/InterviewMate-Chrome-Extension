// Background script for InterviewMate Chrome Extension
// Handles communication between content script and server

// Server configuration
const SERVER_URL = 'http://localhost:8080';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'extractQuestion') {
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

  if (request.action === 'checkServer') {
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

  // Default response for unknown actions
  sendResponse({ success: false, error: 'Unknown action' });
});

// Function to send extracted data to the server
async function sendExtractedData(data) {
  try {
    const response = await fetch(`${SERVER_URL}/api/leetcode-data`, {
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