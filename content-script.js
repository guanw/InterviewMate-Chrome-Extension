// Content script for InterviewMate Chrome Extension
// Extracts Interview question data from the current page

console.log('🚀 InterviewMate Content Script Loaded on:', window.location.href);

async function getFullCode() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: window.ExtensionConstants.ACTION_EXECUTE_IN_PAGE
    }, (response) => {
      resolve(response || "");
    });
  });
}

// Function to extract Interview question data
async function extractInterviewData() {
  try {
    // Wait for the page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return extractInterviewData();
    }

    const data = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      problem: {},
      code: {}
    };

    // Extract problem information
    extractProblemInfo(data);

    // Extract code information (now async)
    await extractCodeInfo(data);

    console.log('📊 Extracted Interview data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error extracting Interview data:', error);
    return null;
  }
}

// Function to extract problem information
function extractProblemInfo(data) {
  // First check if this is a CoderPad page with the specific markdown structure
  const coderPadMarkdownElement = document.querySelector('.MarkdownOutput');

  if (coderPadMarkdownElement) {
    // Extract the full problem content from CoderPad's markdown output
    data.problem.fullContent = coderPadMarkdownElement.textContent.trim();

    // Try to extract a title from the first line or heading
    const firstParagraph = coderPadMarkdownElement.querySelector('p');
    if (firstParagraph) {
      const firstLine = firstParagraph.textContent.trim();
      // Check if the first line looks like a title (short, doesn't contain common problem start phrases)
      if (firstLine.length < 100 && !firstLine.toLowerCase().includes('exercise') && !firstLine.toLowerCase().includes('problem')) {
        data.problem.title = firstLine;
      }
    }

    // If no title found, try to find any heading element
    if (!data.problem.title) {
      const headingElement = coderPadMarkdownElement.querySelector('h1, h2, h3, h4, h5, h6');
      if (headingElement) {
        data.problem.title = headingElement.textContent.trim();
      }
    }

    // Extract problem description (first meaningful paragraph)
    if (firstParagraph && !data.problem.title) {
      data.problem.description = firstParagraph.textContent.trim();
    }
  } else if (window.location.hostname.includes('codility.com')) {
    // Handle Codility-specific extraction
    const taskTitleElement = document.querySelector('.task-title') ||
                            document.querySelector('h1') ||
                            document.querySelector('[class*="title"]');

    if (taskTitleElement) {
      data.problem.title = taskTitleElement.textContent.trim();
    }

    // Extract problem description from Codility's task description
    const taskDescriptionElement = document.querySelector('.task-description') ||
                                  document.querySelector('.markdown') ||
                                  document.querySelector('[class*="description"]');

    if (taskDescriptionElement) {
      data.problem.description = taskDescriptionElement.textContent.trim();
      data.problem.fullContent = taskDescriptionElement.textContent.trim();
    }
  } else {
    // Fallback to original extraction logic for other platforms
    // Extract problem title
    const titleElement = document.querySelector('[data-e2e-locator="problem-title"]') ||
                         document.querySelector('.text-title') ||
                         document.querySelector('h1') ||
                         document.querySelector('[class*="title"]');

    if (titleElement) {
      data.problem.title = titleElement.textContent.trim();
    }

    // Extract problem description
    const descriptionElement = document.querySelector('[data-e2e-locator="problem-description"]') ||
                             document.querySelector('.question-description') ||
                             document.querySelector('[class*="description"]');

    if (descriptionElement) {
      data.problem.description = descriptionElement.textContent.trim();
    }
  }

  // If we still don't have a title but have content, use a generic title
  if (!data.problem.title && data.problem.fullContent) {
    data.problem.title = "Problem Description";
  }
}

// Function to extract code information
async function extractCodeInfo(data) {
  // Try different code editors that interview website might use

  // Monaco Editor (most common) - used by Codility and others
  const monacoContent = await getFullCode();
  if (monacoContent) {
    data.code.monaco = {
      content: monacoContent
    };
    console.log('✅ Extracted code from Monaco editor via model');
  }

  // Codility-specific code extraction (if Monaco didn't work)
  if (window.location.hostname.includes('codility.com') && !monacoContent) {
    try {
      // Try to find Codility's specific code editor elements
      const codilityEditor = document.querySelector('.ace_editor') ||
                            document.querySelector('.editor-container');

      if (codilityEditor) {
        // Try to get the editor instance from Codility's global scope
        if (window.editor && window.editor.getValue) {
          const codeContent = window.editor.getValue();
          if (codeContent) {
            data.code.codility = {
              content: codeContent,
              editorType: 'codility'
            };
            console.log('✅ Extracted code from Codility editor');
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract Codility editor code:', error);
    }
  }

  // CodeMirror Editor (alternative)
  const codeMirrorEditors = [document.querySelector('.CodeMirror'), document.querySelector('[class*="codemirror"]')];
  if (codeMirrorEditors) {
    try {
      codeMirrorEditors.forEach(() => {
        const codeMirrorInstance = codeMirrorEditor.CodeMirror;
        if (codeMirrorInstance) {
          codeMirrorContent = codeMirrorInstance.getValue();
          if (data.code.codemirror.content) {
            data.code.codemirror.content += "\n" +codeMirrorContent
          }
          data.code.codemirror = {
            content: codeMirrorContent
          };
        }
      })

    } catch (error) {
      console.warn('Could not extract CodeMirror editor code:', error);
    }
  }

  // Simple textarea (fallback)
  const textareas = document.querySelectorAll('textarea');
  for (const textarea of textareas) {
    if (textarea.value && textarea.value.trim().length > 0) {
      textarea_value = textarea.value
      if (data.code.textarea && data.code.textarea.content) {
        data.code.textarea.content += "\n" + textarea_value
      } else {
        data.code.textarea = {
          content: textarea_value
        };
      }
      break;
    }
  }
}


// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📩 Content script received message:', request);
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Hostname:', window.location.hostname);

  if (request.action === window.ExtensionConstants.ACTION_EXTRACT) {
    console.log('📤 Extracting data from page...');
    extractInterviewData().then(data => {
      if (data) {
        // Send data to background script for server communication
        chrome.runtime.sendMessage({
          action: window.ExtensionConstants.ACTION_EXTRACT_QUESTION,
          data
        }, (response) => {
          console.log('✅ Background script response:', response);
          sendResponse(response);
        });
      } else {
        sendResponse({ success: false, error: 'Could not extract data from this page' });
      }
    }).catch(error => {
      console.error('❌ Error extracting data:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === window.ExtensionConstants.ACTION_CHECK_INTERVIEW) {
    const isInterview = window.ExtensionConstants.INTERVIEW_PLATFORMS.some(platform =>
      window.location.hostname.includes(platform.replace('.com', '').replace('app.', ''))
    );
    console.log('📋 Interview check:', { isInterview, url: window.location.href });
    sendResponse({ isInterview });
  }

  if (request.action === window.ExtensionConstants.ACTION_TEST) {
    // Debug test message
    console.log('✅ Content script test message received successfully');
    console.log('📍 Content script is active on:', window.location.href);
    sendResponse({
      success: true,
      message: 'Content script is working!',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
      isCodility: window.location.hostname.includes('codility.com'),
      platformDetected: window.ExtensionConstants.INTERVIEW_PLATFORMS.some(platform =>
        window.location.hostname.includes(platform.replace('.com', '').replace('app.', ''))
      )
    });
    return true;
  }
});

// Send a heartbeat message to indicate content script is loaded
console.log('🚀 InterviewMate Content Script Loaded on:', window.location.href);
console.log('📋 Supported platforms:', window.ExtensionConstants.INTERVIEW_PLATFORMS);
console.log('📍 Current hostname:', window.location.hostname);
console.log('📍 Is Codility?', window.location.hostname.includes('codility.com'));

// Check if we're on a supported platform
const isSupportedPlatform = window.ExtensionConstants.INTERVIEW_PLATFORMS.some(platform =>
  window.location.hostname.includes(platform.replace('.com', '').replace('app.', ''))
);
console.log('📋 Is supported platform?', isSupportedPlatform);

if (isSupportedPlatform) {
  console.log('✅ Content script ready for extraction');
} else {
  console.log('⚠️ Not on a supported platform, content script will not extract data');
}
