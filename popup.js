// Popup script for CodingMate Chrome Extension
// Handles UI interactions and communication with background script

// Helper functions (global scope)
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

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.addEventListener("DOMContentLoaded", () => {
  const extractBtn = document.getElementById("extractBtn");
  const checkBtn = document.getElementById("checkBtn");
  const statusDiv = document.getElementById("status");
  const statusText = document.getElementById("statusText");
  const messageDiv = document.getElementById("message");

  let serverConnected = false;
  let currentTab = null;

  // Debug: Extension loaded
  console.log("🚀 Code Productivity Suite Extension Loaded");
  console.log("🔍 Extension ID:", chrome.runtime.id);

  // Add test buttons for debugging
  addDebugControls();

  // Initialize popup
  initializePopup();

  async function initializePopup() {
    try {
      // Get current tab
      currentTab = await getCurrentTab();

      // Check if we can analyze code on this page
      if (
        currentTab &&
        currentTab.url &&
        !currentTab.url.startsWith("chrome://")
      ) {
        // Check server connection
        await checkServerConnection();
      } else {
        updateStatus("error", "Please navigate to a webpage to analyze code");
        extractBtn.disabled = true;
      }

      // Set up event listeners
      setupEventListeners();
    } catch (error) {
      console.error("Error initializing popup:", error);
      updateStatus("error", "Failed to initialize extension");
    }
  }

  function setupEventListeners() {
    extractBtn.addEventListener("click", extractWen);
    checkBtn.addEventListener("click", checkServerConnection);
  }

  async function checkServerConnection() {
    updateStatus("connecting", "Checking server connection...");

    try {
      const response = await sendMessageToBackground({
        action: window.ExtensionConstants.ACTION_CHECK_SERVER,
      });

      if (response && response.connected) {
        serverConnected = true;
        updateStatus("connected", "✅ Connected to code analysis service");
        extractBtn.disabled = false;
        hideMessage();
      } else {
        serverConnected = false;
        updateStatus("disconnected", "❌ Cannot connect to server");
        extractBtn.disabled = true;
        showMessage(
          "Make sure the code analysis service is running on localhost:8080",
          "error",
        );
      }
    } catch (error) {
      console.error("Error checking server connection:", error);
      serverConnected = false;
      updateStatus("error", "⚠️ Error checking connection");
      extractBtn.disabled = true;
      showMessage("Connection check failed", "error");
    }
  }

  async function extractWen() {
    if (
      !currentTab ||
      !currentTab.url ||
      currentTab.url.startsWith("chrome://")
    ) {
      showMessage("Please navigate to a webpage to analyze code", "error");
      return;
    }

    if (!serverConnected) {
      showMessage(
        "Server is not connected. Please check the connection first.",
        "error",
      );
      return;
    }

    try {
      extractBtn.disabled = true;
      extractBtn.textContent = "⏳ Extracting...";

      // Send extract message to content script
      const response = await sendMessageToTab(currentTab.id, {
        action: window.ExtensionConstants.ACTION_EXTRACT,
      });

      if (response && response.success) {
        showMessage("✅ Code analyzed and sent to local service!", "success");
        updateStatus("connected", "✅ Sent successfully");
      } else {
        const errorMsg = response ? response.error : "Unknown error occurred";
        showMessage(`❌ Extraction failed: ${errorMsg}`, "error");
        updateStatus("error", "⚠️ Extraction failed");
      }
    } catch (error) {
      console.error("Error extracting:", error);
      if (
        error.message &&
        error.message.includes("Receiving end does not exist")
      ) {
        showMessage(
          "❌ Content script not loaded. Try refreshing the page and extracting again.",
          "error",
        );
      } else {
        showMessage(`❌ Extraction error: ${error.message}`, "error");
      }
      updateStatus("error", "⚠️ Extraction error");
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = "📤 Extract";
    }
  }

  function updateStatus(type, text) {
    statusDiv.className = `status ${type}`;
    statusText.textContent = text;
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(hideMessage, 5000);
    }
  }

  function hideMessage() {
    messageDiv.style.display = "none";
  }

  // Check server connection when popup opens
  setTimeout(checkServerConnection, 500);
});

// Debug functions for troubleshooting
function addDebugControls() {
  // Add test buttons to popup
  const debugSection = document.createElement("div");
  debugSection.className = "debug-section";
  debugSection.innerHTML = `
    <div><strong>🧪 Debug Controls</strong></div>
    <button id="test-bg" class="debug-btn">Test Background</button>
    <button id="test-content" class="debug-btn">Test Content</button>
    <button id="test-server" class="debug-btn">Test Server</button>
    <button id="test-all" class="debug-btn">Test All</button>
    <button id="clear-log" class="debug-btn clear-log">Clear Log</button>
    <div id="debug-output" class="debug-output"></div>
  `;

  document.body.appendChild(debugSection);

  // Add event listeners
  document
    .getElementById("test-bg")
    .addEventListener("click", testBackgroundCommunication);
  document
    .getElementById("test-content")
    .addEventListener("click", testContentScriptCommunication);
  document
    .getElementById("test-server")
    .addEventListener("click", testServerConnection);
  document.getElementById("test-all").addEventListener("click", runAllTests);
  document.getElementById("clear-log").addEventListener("click", clearDebugLog);
}

async function testBackgroundCommunication() {
  logDebug("🧪 Testing background script communication...");

  try {
    const response = await sendMessageToBackground({
      action: window.ExtensionConstants.ACTION_CHECK_SERVER,
    });
    logDebug("✅ Background script response:", response);
  } catch (error) {
    logDebug("❌ Background script error:", error.message);
  }
}

async function testContentScriptCommunication() {
  logDebug("🧪 Testing content script communication...");

  try {
    const tab = await getCurrentTab();
    logDebug("📋 Current tab:", { url: tab.url, title: tab.title });

    if (!tab.url || tab.url.startsWith("chrome://")) {
      logDebug("⚠️ Not on webpage, skipping content script test");
      logDebug("💡 Please navigate to a webpage to test content script");
      return;
    }

    logDebug("🔍 Testing basic content script connection...");

    // First test basic connection with a simple test message
    try {
      const testResponse = await sendMessageToTab(tab.id, {
        action: window.ExtensionConstants.ACTION_TEST,
      });
      logDebug("✅ Content script test response:", testResponse);

      if (testResponse && testResponse.success) {
        logDebug("🧪 Testing data extraction...");
        const extractResponse = await sendMessageToTab(tab.id, {
          action: window.ExtensionConstants.ACTION_EXTRACT,
        });
        logDebug("✅ Content script extract response:", extractResponse);
      }
    } catch (messageError) {
      logDebug("❌ Message sending error:", messageError.message);

      if (messageError.message.includes("Receiving end does not exist")) {
        logDebug("💡 Content script is not loaded on this page");
        logDebug("💡 Make sure you are on a webpage with code content");
        logDebug("💡 Try refreshing the page and test again");
      }
    }
  } catch (error) {
    logDebug("❌ Content script error:", error.message);
  }
}

async function testServerConnection() {
  logDebug("🧪 Testing server connection...");

  try {
    const response = await fetch("http://localhost:8080/api/health");
    const data = await response.json();
    logDebug("✅ Server response:", data);
  } catch (error) {
    logDebug("❌ Server connection error:", error.message);
  }
}

async function runAllTests() {
  logDebug("🧪 Running all tests...");
  await testBackgroundCommunication();
  await testContentScriptCommunication();
  await testServerConnection();
  logDebug("🏁 All tests completed");
}

function logDebug(message, data = null) {
  console.log(message, data);
  const outputDiv = document.getElementById("debug-output");
  if (outputDiv && document.body.contains(outputDiv)) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    outputDiv.innerHTML += `<div>[${timestamp}] ${logMessage}</div>`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
  }
}

function clearDebugLog() {
  const outputDiv = document.getElementById("debug-output");
  if (outputDiv && document.body.contains(outputDiv)) {
    outputDiv.innerHTML = "";
    console.log("🧹 Debug log cleared");
    // Add a small message to indicate the log was cleared
    setTimeout(() => {
      if (outputDiv.innerHTML === "") {
        outputDiv.innerHTML =
          '<div style="color: #666; font-style: italic;">Debug log cleared...</div>';
        setTimeout(() => {
          outputDiv.innerHTML = "";
        }, 1000);
      }
    }, 100);
  }
}

// Global error handler
window.addEventListener("error", (e) => {
  console.error("❌ Popup Error:", e.error);
  logDebug("❌ Global error:", e.error.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("❌ Popup Promise Rejection:", e.reason);
  logDebug("❌ Promise rejection:", e.reason);
});
