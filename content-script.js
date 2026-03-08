// Content script for CodingMate Chrome Extension
// Extracts Coding question data from the current page

console.log("🚀 CodingMate Content Script Loaded on:", window.location.href);

// Function to request OCR extraction from background script
async function extractCodingData() {
  try {
    // Wait for the page to be fully loaded
    if (document.readyState !== "complete") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return extractCodingData();
    }

    // Prepare metadata for OCR request
    const data = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Requesting OCR capture from background script:", {
      url: data.url,
      timestamp: data.timestamp,
    });
    return data;
  } catch (error) {
    console.error("❌ Error preparing OCR request:", error);
    return null;
  }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Content script received message:", request);
  console.log("📍 Current URL:", window.location.href);
  console.log("📍 Hostname:", window.location.hostname);

  if (request.action === window.ExtensionConstants.ACTION_EXTRACT) {
    console.log("📤 Requesting OCR extraction...");
    extractCodingData()
      .then((data) => {
        if (data) {
          // Request OCR capture from background script
          chrome.runtime.sendMessage(
            {
              action: window.ExtensionConstants.ACTION_REQUEST_OCR_CAPTURE,
              data,
            },
            (response) => {
              console.log("✅ Background script OCR response:", response);
              sendResponse(response);
            },
          );
        } else {
          sendResponse({
            success: false,
            error: "Could not prepare OCR request",
          });
        }
      })
      .catch((error) => {
        console.error("❌ Error preparing OCR request:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === window.ExtensionConstants.ACTION_CHECK_CODING) {
    const isSupported = window.ExtensionConstants.SUPPORTED_PLATFORMS.some(
      (platform) =>
        window.location.hostname.includes(
          platform.replace(".com", "").replace("app.", ""),
        ),
    );
    console.log("📋 Coding check:", {
      isCoding: isSupported,
      url: window.location.href,
    });
    sendResponse({ isCoding: isSupported });
  }

  if (request.action === window.ExtensionConstants.ACTION_TEST) {
    // Debug test message
    console.log("✅ Content script test message received successfully");
    console.log("📍 Content script is active on:", window.location.href);
    sendResponse({
      success: true,
      message: "Content script is working!",
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
      isCodility: window.location.hostname.includes("codility.com"),
      platformDetected: window.ExtensionConstants.SUPPORTED_PLATFORMS.some(
        (platform) =>
          window.location.hostname.includes(
            platform.replace(".com", "").replace("app.", ""),
          ),
      ),
    });
    return true;
  }
});

// Send a heartbeat message to indicate content script is loaded
console.log("🚀 CodingMate Content Script Loaded on:", window.location.href);
console.log(
  "📋 Supported platforms:",
  window.ExtensionConstants.SUPPORTED_PLATFORMS,
);
console.log("📍 Current hostname:", window.location.hostname);
console.log(
  "📍 Is Codility?",
  window.location.hostname.includes("codility.com"),
);

// Check if we're on a supported platform
const isSupportedPlatform = window.ExtensionConstants.SUPPORTED_PLATFORMS.some(
  (platform) =>
    window.location.hostname.includes(
      platform.replace(".com", "").replace("app.", ""),
    ),
);
console.log("📋 Is supported platform?", isSupportedPlatform);

if (isSupportedPlatform) {
  console.log("✅ Content script ready for extraction");
} else {
  console.log(
    "⚠️ Not on a supported platform, content script will not extract data",
  );
}
