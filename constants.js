// Extension Constants
// Shared between popup, content script, and background script

// Message actions
const ACTION_EXECUTE_IN_PAGE = 'executeInPage';
const ACTION_EXTRACT = 'extract';
const ACTION_EXTRACT_QUESTION = 'extractQuestion';
const ACTION_CHECK_INTERVIEW = 'checkInterview';
const ACTION_CHECK_SERVER = 'checkServer';
const ACTION_TEST = 'test';

// Server configuration
const SERVER_URL = 'http://localhost:8080';

// Interview platforms
const INTERVIEW_PLATFORMS = ['leetcode.com', 'hackerrank.com', 'coderpad.io'];

// Global scope (for content script and popup)
window.ExtensionConstants = {
    ACTION_EXECUTE_IN_PAGE,
    ACTION_EXTRACT,
    ACTION_EXTRACT_QUESTION,
    ACTION_CHECK_INTERVIEW,
    ACTION_CHECK_SERVER,
    ACTION_TEST,
    SERVER_URL,
    INTERVIEW_PLATFORMS
};