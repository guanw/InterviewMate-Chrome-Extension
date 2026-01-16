// Background script for InterviewMate Chrome Extension
// Handles communication between content script and server

// Constants (shared with other extension scripts via constants.js)
const ACTION_REQUEST_OCR_CAPTURE = "requestOcrCapture";
const ACTION_CHECK_SERVER = "checkServer";
const ACTION_TEST = "test";
const SERVER_URL = "http://localhost:8080";

// Debug: Background script loaded
console.log("🚀 InterviewMate Background Script Loaded");
console.log("🔍 Extension ID:", chrome.runtime.id);

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Background received message:", {
    action: request.action,
    sender: sender.tab ? sender.tab.url : "popup",
    timestamp: new Date().toISOString(),
  });

  if (request.action === ACTION_REQUEST_OCR_CAPTURE) {
    // Capture screenshot from the requesting tab and send OCR data to server
    handleOcrCaptureRequest(request.data, sender)
      .then((response) => {
        console.log("OCR capture and send completed:", response);
        sendResponse({
          success: true,
          message: "OCR data sent to InterviewMate app",
        });
      })
      .catch((error) => {
        console.error("Error during OCR capture:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === ACTION_EXTRACT_OCR) {
    // Send OCR data to the server
    sendOCRData(request.data)
      .then((response) => {
        console.log("OCR data sent to server:", response);
        sendResponse({
          success: true,
          message: "OCR data sent to InterviewMate app",
        });
      })
      .catch((error) => {
        console.error("Error sending OCR data to server:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === ACTION_EXTRACT_QUESTION) {
    // Send extracted data to the server
    sendExtractedData(request.data)
      .then((response) => {
        console.log("Data sent to server:", response);
        sendResponse({
          success: true,
          message: "Question sent to InterviewMate app",
        });
      })
      .catch((error) => {
        console.error("Error sending data to server:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === ACTION_CHECK_SERVER) {
    // Check if server is reachable
    checkServerConnection()
      .then((isConnected) => {
        sendResponse({ connected: isConnected });
      })
      .catch((error) => {
        console.error("Error checking server:", error);
        sendResponse({ connected: false, error: error.message });
      });
    return true;
  }

  if (request.action === ACTION_TEST) {
    // Debug test message
    console.log("✅ Background test message received successfully");
    sendResponse({
      success: true,
      message: "Background script is working!",
      timestamp: new Date().toISOString(),
      extensionId: chrome.runtime.id,
    });
    return true;
  }

  // Default response for unknown actions
  console.log("⚠️ Unknown action received:", request.action);
  sendResponse({ success: false, error: "Unknown action" });
});

// Function to handle OCR capture request from content script
async function handleOcrCaptureRequest(data, sender) {
  try {
    console.log(
      "📸 Capturing screenshot from tab:",
      sender.tab.id,
      "in window:",
      sender.tab.windowId,
    );

    // Capture the visible tab in the sender's window
    const screenshot = await chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: "png" },
    );

    console.log("✅ Screenshot captured, size:", screenshot.length);

    // Send OCR data to the server
    return await sendOCRData({
      image: screenshot,
      url: data.url,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error("Failed to capture screenshot:", error);
    throw error;
  }
}

// Function to send OCR data to the server
async function sendOCRData(data) {
  try {
    const response = await fetch(`${SERVER_URL}/api/extract-ocr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        extensionId: chrome.runtime.id,
        image: data.image,
        url: data.url,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send OCR data to server:", error);
    throw error;
  }
}

// Function to check server connectivity
async function checkServerConnection() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: "GET",
      timeout: 5000, // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.log("Server connection failed:", error.message);
    return false;
  }
}

// Initialize background script
console.log("InterviewMate background script loaded");
