# AI Tab Summarizer

AI Tab Summarizer is a Manifest V3 Chrome Extension that interfaces directly with the Google Gemini API client-side to summarize webpages and multiple browser tabs. It operates entirely within the browser, utilizing no external backend servers.

## Features

- **Summarize Current Tab:** Get a quick summary of the currently active tab.
- **Summarize All Tabs:** Generate summaries for all open tabs in your current window.
- **Select Tabs Mode:** Choose specific tabs to summarize from a list.
- **Ask Across Tabs:** Ask questions about the content of multiple tabs to synthesize information.
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
3. **Summarize:** Choose an action:
   - Click **Summarize Current Tab** for the active page.
   - Click **Summarize All Tabs** to process all open tabs.
   - Click **Select Tabs** to pick which tabs you want to include, then click **Summarize Selected Tabs**.
4. **Q&A:** Alternatively, use the "Ask a question about these tabs" input to query the contents of your open tabs.
5. Results will appear in the panel below, and you can copy them using the "Copy" button.

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
