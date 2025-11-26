// Content script for InterviewMate Chrome Extension
// Extracts Interview question data from the current page

console.log('🚀 InterviewMate Content Script Loaded on:', window.location.href);

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
      data.problem.description = descriptionElement.textContent.trim(); // Limit length
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

  // Monaco Editor (most common)
  let monacoContent = '';

  // Method 1: Extract from Monaco editor DOM
  const monacoEditor = document.querySelector('.monaco-editor') ||
                      document.querySelector('[class*="monaco"]');
  if (monacoEditor) {
    try {
      // Monaco stores line content in .view-line divs within .view-lines container
      const viewLines = monacoEditor.querySelector('.view-lines');
      if (viewLines) {
        // Each .view-line represents one line of code
        // Use direct children to avoid getting nested duplicates
        const lines = Array.from(viewLines.children).filter(child =>
          child.classList.contains('view-line') ||
          child.className.includes('view-line')
        );

        if (lines.length > 0) {
          monacoContent = lines.map(line => {
            // For each line, get the text from the innermost text nodes
            // Monaco wraps tokens in spans, we need to get just the text
            const lineContent = line.innerText || line.textContent;
            return lineContent;
          }).join('\n');

          console.log('✅ Extracted code from Monaco editor via DOM');
        }
      }
    } catch (error) {
      console.warn('Could not extract Monaco editor code via DOM:', error);
    }
  }

  if (monacoContent) {
    data.code.monaco = {
      content: monacoContent
    };
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
  console.log('Content script received message:', request);

  if (request.action === 'extract') {
    console.log('📤 Extracting data from page...');
    extractInterviewData().then(data => {
      if (data) {
        // Send data to background script for server communication
        chrome.runtime.sendMessage({
          action: 'extractQuestion',
          data
        }, (response) => {
          console.log('✅ Background script response:', response);
          sendResponse(response);
        });
      } else {
        sendResponse({ success: false, error: 'Could not extract data from this page' });
      }
    }).catch(error => {
      console.error('Error extracting data:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
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
