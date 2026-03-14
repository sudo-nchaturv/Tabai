/**
 * Extracts and cleans the text content from the current webpage.
 * Used for summarization.
 */
function extractPageContent() {
  try {
    // Basic extraction using innerText which naturally excludes scripts and styles
    // in most modern browsers, but we'll do some basic cleanup just in case.
    let text = document.body.innerText;

    // Clean up the text:
    // 1. Remove extra whitespace and newlines
    // 2. Collapse multiple spaces into one
    text = text.replace(/\s+/g, ' ').trim();

    // Optional: get page title
    const title = document.title || 'Untitled Page';

    return {
      title: title,
      content: text,
      url: window.location.href,
      success: true
    };
  } catch (error) {
    console.error('AI Tab Summarizer: Error extracting content', error);
    return {
      title: document.title || 'Untitled Page',
      content: '',
      url: window.location.href,
      success: false,
      error: error.message
    };
  }
}

// Return the extracted content.
// This is executed when chrome.scripting.executeScript runs this file.
extractPageContent();
