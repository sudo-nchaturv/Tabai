# AI Tab Summarizer

AI Tab Summarizer is a Manifest V3 Chrome Extension that interfaces directly with the Google Gemini API client-side to summarize webpages and multiple browser tabs. It operates entirely within the browser, utilizing no external backend servers.

## Features

- **Chat with Current Tab:** The default state allows you to instantly ask questions and get answers based on the content of your currently active tab.
- **Select Tabs to Chat With:** Choose specific tabs from your open windows to synthesize information and ask questions across multiple sources.
- **Summarize Current Tab:** Get a quick, structured summary of the currently active tab with one click.
- **Direct Client-Side Integration:** Communicates directly with the Google Gemini API from your browser.
- **Privacy-Focused:** No intermediate servers are used; your API key and data are processed locally within the extension.

## Installation

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `extension` directory from this repository.
5. The extension should now appear in your list of extensions. Pin it for easy access!

## Usage

1. Click on the AI Tab Summarizer icon in your Chrome toolbar.
2. **Setup:** In the "Settings" section, enter your personal Google Gemini API Key and click "Save Key". Your key is stored locally in your browser.
3. **Chat/Summarize:** Choose an action:
   - **Chat with current tab:** Simply type your question in the input box and click "Ask Question".
   - **Summarize Current Tab:** Click the button to get a quick summary of the active page.
   - **Select Tabs to Chat With:** Click this to pick multiple tabs from a list. Confirm your selection, and then you can ask a question that synthesizes information across all selected tabs.
4. Results will appear in the panel below, and you can easily copy them using the "Copy" button.

## Architecture

This extension is built using **Vanilla JavaScript** (async/await) and follows a modular structure. It strictly avoids the use of external frontend frameworks (like React, Vue, etc.).

Key files include:
- `manifest.json`: Manifest V3 configuration.
- `popup.html` / `popup.js` / `popup.css`: The UI and main logic for the extension's popup interface.
- `background.js`: Service worker for background tasks and managing tab information.
- `content.js`: Script injected into webpages to extract text content.
- `utils.js`: Utility functions used across the extension.

## Privacy Note

This extension requires a valid Google Gemini API key to function. The key is stored securely using the Chrome Storage API on your local machine. Text extracted from your tabs is sent directly to the Google Gemini API to generate summaries and answer questions. No data is sent to or stored on any third-party servers other than Google's API endpoints.

## License

[MIT License](LICENSE) (If applicable)
