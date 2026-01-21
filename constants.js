// Extension Constants
// Shared between popup, content script, and background script

// Message actions
const ACTION_EXTRACT = "extract";
const ACTION_REQUEST_OCR_CAPTURE = "requestOcrCapture";
const ACTION_CHECK_CODING = "checkCoding";
const ACTION_CHECK_SERVER = "checkServer";
const ACTION_TEST = "test";

// Server configuration
const SERVER_URL = "http://localhost:8080";

// Supported platforms for code analysis
const SUPPORTED_PLATFORMS = [
  "leetcode.com",
  "hackerrank.com",
  "coderpad.io",
  "codility.com",
  "github.com",
  "stackoverflow.com",
];

// Global scope (for content script and popup)
window.ExtensionConstants = {
  ACTION_EXTRACT,
  ACTION_REQUEST_OCR_CAPTURE,
  ACTION_CHECK_CODING,
  ACTION_CHECK_SERVER,
  ACTION_TEST,
  SERVER_URL,
  SUPPORTED_PLATFORMS,
};
