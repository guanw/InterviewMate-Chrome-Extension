# CodingMate Chrome Extension

A Chrome extension that extracts Coding questions and sends them to the CodingMate desktop app.

## Features

- 🔍 **Smart Detection**: Automatically detects Coding problem pages on LeetCode, HackerRank, and CoderPad
- 📤 **Question Extraction**: Extracts problem details and code
- 🌐 **Server Communication**: Sends data to the CodingMate app via localhost:8080
- 💬 **Real-time Status**: Shows connection status and extraction results
- 🎯 **User-Friendly UI**: Clean, intuitive popup interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension should now appear in your extensions list

## Usage

1. **Navigate** to any Coding problem page
2. **Click** the CodingMate extension icon in your toolbar
3. **Check** the server connection status
4. **Click** "Extract Question" to send the problem to the CodingMate app
5. **View** the extracted question in the CodingMate app

## File Structure

```
coding-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for server communication
├── content-script.js      # Coding data extraction logic
├── popup.html             # Extension popup UI
├── popup.js               # Popup interaction logic
└── README.md              # This file
```

## How It Works

### 1. Content Script

- Runs on Coding pages
- Extracts problem information using DOM selectors
- Supports multiple code editor types (Monaco, CodeMirror, textarea)
- Detects programming language from code content

### 2. Background Script

- Handles communication between content script and server
- Manages HTTP requests to the CodingMate app
- Provides server connectivity checking

### 3. Popup UI

- Shows server connection status
- Provides extract button and status messages
- Validates that user is on a Coding page

## Data Extraction

The extension extracts the following information from Coding pages:

### Problem Information

- **Title**: Problem name
- **Description**: Problem statement (first 2000 chars)

### Code Information

- **Monaco Editor**: Code from Coding's Monaco editor
- **CodeMirror Editor**: Code from CodeMirror editor
- **Textarea**: Code from simple text areas
- **Code Snippets**: Code from pre/code elements

## Server Communication

The extension communicates with the CodingMate app via:

- **Endpoint**: `http://localhost:8080/api/coding-question-data`
- **Method**: POST
- **Format**: JSON with timestamp, extension ID, and extracted data

## Browser Compatibility

- **Chrome**: Manifest V3 compatible
- **Permissions**: activeTab, storage, scripting, host_permissions

## Development

### Testing Locally

1. Install the extension in Chrome (Developer mode)
2. Start the CodingMate app
3. Navigate to a Coding problem
4. Use the extension popup to extract and send data

### Debugging

1. Open Chrome DevTools on the Coding page
2. Check the Console for content script logs
3. Open `chrome://extensions/` and click "background page" for background script logs

## Security

- runs on `leetcode.com`, `hackerrank.com`, `coderpad.io` domains
- Only communicates with `localhost:8080`
- No external network requests
- No data storage or tracking

## License

This extension is part of the CodingMate project.
