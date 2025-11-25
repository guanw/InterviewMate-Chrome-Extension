// Content script for InterviewMate Chrome Extension
// Extracts Interview question data from the current page

console.log('🚀 InterviewMate Content Script Loaded on:', window.location.href);

// Function to extract Interview question data
function extractInterviewData() {
  try {
    // Wait for the page to be fully loaded
    if (document.readyState !== 'complete') {
      setTimeout(extractInterviewData, 1000);
      return;
    }

    const data = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      problem: {},
      code: {}
    };

    // Extract problem information
    extractProblemInfo(data);

    // Extract code information
    extractCodeInfo(data);

    console.log('📊 Extracted Interview data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error extracting Interview data:', error);
    return null;
  }
}

// Function to extract problem information
function extractProblemInfo(data) {
  // Extract problem title
  const titleElement = document.querySelector('[data-e2e-locator="problem-title"]') ||
                       document.querySelector('.text-title') ||
                       document.querySelector('h1') ||
                       document.querySelector('[class*="title"]');

  if (titleElement) {
    data.problem.title = titleElement.textContent.trim();
  }

  // Extract difficulty
  const difficultyElement = document.querySelector('[data-e2e-locator="difficulty"]') ||
                           document.querySelector('.text-difficulty') ||
                           document.querySelector('[class*="difficulty"]');

  if (difficultyElement) {
    data.problem.difficulty = difficultyElement.textContent.trim();
  }

  // Extract tags
  const tagElements = document.querySelectorAll('[data-e2e-locator="tag"], .text-tags a, [class*="tag"]');
  if (tagElements.length > 0) {
    data.problem.tags = Array.from(tagElements).map(tag => tag.textContent.trim()).filter(Boolean);
  }

  // Extract problem description
  const descriptionElement = document.querySelector('[data-e2e-locator="problem-description"]') ||
                            document.querySelector('.question-description') ||
                            document.querySelector('[class*="description"]');

  if (descriptionElement) {
    data.problem.description = descriptionElement.textContent.trim().substring(0, 2000); // Limit length
  }
}

// Function to extract code information
function extractCodeInfo(data) {
  // Try different code editors that interview website might use

  // Monaco Editor (most common)
  const monacoEditor = document.querySelector('.monaco-editor') ||
                      document.querySelector('[class*="monaco"]');
  if (monacoEditor) {
    try {
      // Monaco editor code extraction (this is simplified - real implementation would need more work)
      const textarea = monacoEditor.querySelector('textarea') ||
                      monacoEditor.querySelector('[contenteditable="true"]');
      if (textarea) {
        data.code.monaco = {
          content: textarea.value || textarea.textContent || ''
        };
      }
    } catch (error) {
      console.warn('Could not extract Monaco editor code:', error);
    }
  }

  // CodeMirror Editor (alternative)
  const codeMirrorEditor = document.querySelector('.CodeMirror') ||
                          document.querySelector('[class*="codemirror"]');
  if (codeMirrorEditor) {
    try {
      const codeMirrorInstance = codeMirrorEditor.CodeMirror;
      if (codeMirrorInstance) {
        data.code.codemirror = {
          content: codeMirrorInstance.getValue()
        };
      }
    } catch (error) {
      console.warn('Could not extract CodeMirror editor code:', error);
    }
  }

  // Simple textarea (fallback)
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.value && textarea.value.trim().length > 0) {
      data.code.textarea = {
        content: textarea.value
      };
      break;
    }
  }

  // Look for pre/code elements that might contain code
  const codeElements = document.querySelectorAll('pre, code');
  for (const element of codeElements) {
    if (element.textContent && element.textContent.trim().length > 10) {
      data.code.snippet = {
        content: element.textContent.trim()
      };
      break;
    }
  }
}


// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === 'extract') {
    console.log('📤 Extracting data from page...');
    const data = extractInterviewData();
    if (data) {
      // Send data to background script for server communication
      chrome.runtime.sendMessage({
        action: 'extractQuestion',
        data
      }, (response) => {
        console.log('✅ Background script response:', response);
        sendResponse(response);
      });
      return true; // Keep message channel open
    } else {
      sendResponse({ success: false, error: 'Could not extract data from this page' });
    }
  }

  if (request.action === 'checkInterview') {
    const isInterview = window.location.hostname.includes('leetcode') || window.location.hostname.includes('hackerrank') || window.location.hostname.includes('coderpad');
    console.log('📋 Interview check:', { isInterview, url: window.location.href });
    sendResponse({ isInterview });
  }

  if (request.action === 'test') {
    // Debug test message
    console.log('✅ Content script test message received successfully');
    sendResponse({
      success: true,
      message: 'Content script is working!',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
    });
    return true;
  }
});