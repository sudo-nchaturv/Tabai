/**
 * Utility functions for API communication and text processing.
 */

// Approximate character limit for API request (to stay safely within bounds)
window.MAX_CHAR_LIMIT = 100000;

/**
 * Truncate text if it exceeds the maximum character limit
 * @param {string} text - The text to truncate
 * @param {number} limit - The maximum allowed characters
 * @returns {string} Truncated text
 */
function truncateText(text, limit = window.MAX_CHAR_LIMIT) {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "\n...[CONTENT TRUNCATED DUE TO LENGTH LIMITS]...";
}

/**
 * Calls the Google Gemini 2.5 Flash API
 * @param {string} apiKey - The user's Gemini API key
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} The model's response text
 */
async function callGeminiAPI(apiKey, prompt) {
  if (!apiKey) {
    throw new Error('API key is missing. Please save your Gemini API key in the settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      let errorMessage = 'Failed to generate summary.';
      if (data.error && data.error.message) {
        errorMessage += ` API Error: ${data.error.message}`;
      } else if (response.status === 400) {
          errorMessage = 'Invalid request or API Key.';
      } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      throw new Error(errorMessage);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('The model did not return any content.');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection or API key validity.');
    }
    throw error;
  }
}

/**
 * Parses markdown-like text to basic HTML for rendering in the popup
 * @param {string} text - The raw text from the API
 * @returns {string} HTML formatted string
 */
function formatResponseToHTML(text) {
  if (!text) return '';

  // Very basic HTML escaping to prevent obvious XSS
  const escapeHTML = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const escapedText = escapeHTML(text);

  // Basic markdown parsing for the expected structure
  let html = escapedText
    // Handle bolding for headers
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle list items
    .replace(/^\* (.*)$/gm, '<li>$1</li>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    // Wrap consecutive list items in <ul>
    .replace(/(<li>.*<\/li>(\n<li>.*<\/li>)*)/g, '<ul>$1</ul>')
    // Handle headers (like TITLE, TLDR, etc.)
    .replace(/^([A-Z\s]+)$/gm, '<h2>$1</h2>')
    // Handle newlines
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br/>');

  return html;
}

// Export for popup.js to use
window.truncateText = truncateText;
window.callGeminiAPI = callGeminiAPI;
window.formatResponseToHTML = formatResponseToHTML;
