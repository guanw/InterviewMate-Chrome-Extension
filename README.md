# InterviewMate Chrome Extension

A Chrome extension that extracts LeetCode questions and sends them to the InterviewMate desktop app.

## Features

- 🔍 **Smart Detection**: Automatically detects LeetCode problem pages
- 📤 **Question Extraction**: Extracts problem details, difficulty, tags, and code
- 🌐 **Server Communication**: Sends data to the InterviewMate app via localhost:8080
- 💬 **Real-time Status**: Shows connection status and extraction results
- 🎯 **User-Friendly UI**: Clean, intuitive popup interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension should now appear in your extensions list

## Usage

1. **Navigate** to any LeetCode problem page
2. **Click** the InterviewMate extension icon in your toolbar
3. **Check** the server connection status
4. **Click** "Extract Question" to send the problem to the InterviewMate app
5. **View** the extracted question in the InterviewMate app

## File Structure

```
interview-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for server communication
├── content-script.js      # LeetCode data extraction logic
├── popup.html            # Extension popup UI
├── popup.js              # Popup interaction logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## How It Works

### 1. Content Script

- Runs on LeetCode pages
- Extracts problem information using DOM selectors
- Supports multiple code editor types (Monaco, CodeMirror, textarea)
- Detects programming language from code content

### 2. Background Script

- Handles communication between content script and server
- Manages HTTP requests to the InterviewMate app
- Provides server connectivity checking

### 3. Popup UI

- Shows server connection status
- Provides extract button and status messages
- Validates that user is on a LeetCode page

## Data Extraction

The extension extracts the following information from LeetCode pages:

### Problem Information

- **Title**: Problem name
- **Difficulty**: Easy/Medium/Hard
- **Tags**: Problem categories and topics
- **Description**: Problem statement (first 2000 chars)

### Code Information

- **Monaco Editor**: Code from LeetCode's Monaco editor
- **CodeMirror Editor**: Code from CodeMirror editor
- **Textarea**: Code from simple text areas
- **Code Snippets**: Code from pre/code elements

## Server Communication

The extension communicates with the InterviewMate app via:

- **Endpoint**: `http://localhost:8080/api/leetcode-data`
- **Method**: POST
- **Format**: JSON with timestamp, extension ID, and extracted data

## Browser Compatibility

- **Chrome**: Manifest V3 compatible
- **Permissions**: activeTab, storage, scripting, host_permissions

## Development

### Testing Locally

1. Install the extension in Chrome (Developer mode)
2. Start the InterviewMate app
3. Navigate to a LeetCode problem
4. Use the extension popup to extract and send data

### Debugging

1. Open Chrome DevTools on the LeetCode page
2. Check the Console for content script logs
3. Open `chrome://extensions/` and click "background page" for background script logs

## Security

- Only runs on `leetcode.com` domains
- Only communicates with `localhost:8080`
- No external network requests
- No data storage or tracking

## License

This extension is part of the InterviewMate project.
