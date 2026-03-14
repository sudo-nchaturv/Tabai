// Configuration and Constants
const STORAGE_KEY_API = 'gemini_api_key';

// UI Elements
const ui = {
  apiKeyInput: document.getElementById('api-key'),
  saveKeyBtn: document.getElementById('save-key-btn'),
  apiKeyStatus: document.getElementById('api-key-status'),

  summarizeCurrentBtn: document.getElementById('summarize-current-btn'),
  summarizeAllBtn: document.getElementById('summarize-all-btn'),
  selectTabsModeBtn: document.getElementById('select-tabs-mode-btn'),

  tabSelectionSection: document.getElementById('tab-selection-section'),
  tabList: document.getElementById('tab-list'),
  summarizeSelectedBtn: document.getElementById('summarize-selected-btn'),
  cancelSelectionBtn: document.getElementById('cancel-selection-btn'),

  askInput: document.getElementById('ask-input'),
  askBtn: document.getElementById('ask-btn'),

  loadingIndicator: document.getElementById('loading-indicator'),
  errorMessage: document.getElementById('error-message'),
  resultsContent: document.getElementById('results-content'),
  resultsActions: document.getElementById('results-actions'),
  copySummaryBtn: document.getElementById('copy-summary-btn'),

  mainActions: document.getElementById('main-actions')
};

// Global state
let currentApiKey = '';
let openTabs = [];

// Initialize extension
document.addEventListener('DOMContentLoaded', async () => {
  await loadApiKey();
  setupEventListeners();
});

/**
 * Loads the API key from Chrome storage
 */
async function loadApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY_API], (result) => {
      if (result[STORAGE_KEY_API]) {
        currentApiKey = result[STORAGE_KEY_API];
        ui.apiKeyInput.value = currentApiKey;
      }
      resolve();
    });
  });
}

/**
 * Sets up all UI event listeners
 */
function setupEventListeners() {
  ui.saveKeyBtn.addEventListener('click', handleSaveApiKey);
  ui.summarizeCurrentBtn.addEventListener('click', handleSummarizeCurrentTab);
  ui.summarizeAllBtn.addEventListener('click', handleSummarizeAllTabs);
  ui.selectTabsModeBtn.addEventListener('click', handleSelectTabsMode);
  ui.cancelSelectionBtn.addEventListener('click', handleCancelSelection);
  ui.summarizeSelectedBtn.addEventListener('click', handleSummarizeSelectedTabs);
  ui.askBtn.addEventListener('click', handleAskAcrossTabs);
  ui.copySummaryBtn.addEventListener('click', handleCopySummary);
}

/**
 * Validates and saves the API key
 */
function handleSaveApiKey() {
  const key = ui.apiKeyInput.value.trim();

  if (!key) {
    showApiStatus('Please enter an API key', false);
    return;
  }

  chrome.storage.sync.set({ [STORAGE_KEY_API]: key }, () => {
    currentApiKey = key;
    showApiStatus('API key saved successfully!', true);
    setTimeout(() => {
      ui.apiKeyStatus.textContent = '';
      ui.apiKeyStatus.className = 'status-message';
    }, 3000);
  });
}

/**
 * Displays status message for API key saving
 */
function showApiStatus(message, isSuccess) {
  ui.apiKeyStatus.textContent = message;
  ui.apiKeyStatus.className = `status-message ${isSuccess ? 'success' : 'error'}`;
}

/**
 * Injects content script and extracts text from a specific tab
 */
async function extractContentFromTab(tab) {
  // Skip unsupported URLs like chrome:// or chrome-extension://
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return { title: tab.title, content: '', url: tab.url, success: false, error: 'Unsupported URL schema' };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    throw new Error('No result returned from content script');
  } catch (error) {
    console.error(`Error extracting content from tab ${tab.id}:`, error);
    return { title: tab.title, content: '', url: tab.url, success: false, error: error.message };
  }
}

/**
 * UI State Management
 */
function showLoading(show) {
  if (show) {
    ui.loadingIndicator.classList.remove('hidden');
    ui.errorMessage.classList.add('hidden');
    ui.resultsContent.innerHTML = '';
    ui.resultsActions.classList.add('hidden');

    // Disable buttons
    ui.summarizeCurrentBtn.disabled = true;
    ui.summarizeAllBtn.disabled = true;
    ui.summarizeSelectedBtn.disabled = true;
    ui.askBtn.disabled = true;
  } else {
    ui.loadingIndicator.classList.add('hidden');

    // Enable buttons
    ui.summarizeCurrentBtn.disabled = false;
    ui.summarizeAllBtn.disabled = false;
    ui.summarizeSelectedBtn.disabled = false;
    ui.askBtn.disabled = false;
  }
}

function showError(message) {
  ui.errorMessage.textContent = message;
  ui.errorMessage.classList.remove('hidden');
  ui.resultsContent.innerHTML = '';
  ui.resultsActions.classList.add('hidden');
}

function showResults(htmlContent) {
  ui.resultsContent.innerHTML = htmlContent;
  ui.errorMessage.classList.add('hidden');
  ui.resultsActions.classList.remove('hidden');
}

/**
 * Summarize Current Tab
 */
async function handleSummarizeCurrentTab() {
  if (!currentApiKey) {
    showError('Please set your Gemini API key first.');
    return;
  }

  showLoading(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('Could not find active tab.');
    }

    const data = await extractContentFromTab(tab);

    if (!data.success || !data.content) {
      throw new Error(data.error || 'Could not extract content from the page. Note: Some pages (like chrome://) restrict extensions.');
    }

    const cleanText = window.truncateText(data.content);

    const prompt = `
Summarize the following webpage.

Return the result in this structure:

TITLE
TLDR
KEY POINTS
IMPORTANT DATA
ACTIONABLE INSIGHTS

Content:
${cleanText}
`;

    const summaryText = await window.callGeminiAPI(currentApiKey, prompt);
    const htmlResponse = window.formatResponseToHTML(summaryText);

    showResults(htmlResponse);

  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Summarize All Tabs
 */
async function handleSummarizeAllTabs() {
  if (!currentApiKey) {
    showError('Please set your Gemini API key first.');
    return;
  }

  showLoading(true);

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    await processTabsForSummarization(tabs);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}

/**
 * Opens tab selection mode
 */
async function handleSelectTabsMode() {
  ui.mainActions.classList.add('hidden');
  ui.tabSelectionSection.classList.remove('hidden');
  ui.resultsContent.innerHTML = '';
  ui.resultsActions.classList.add('hidden');
  ui.errorMessage.classList.add('hidden');

  // Clear list
  ui.tabList.innerHTML = '';

  // Fetch tabs
  openTabs = await chrome.tabs.query({ currentWindow: true });

  if (openTabs.length === 0) {
    ui.tabList.innerHTML = '<p>No open tabs found.</p>';
    return;
  }

  // Render checkboxes
  openTabs.forEach((tab, index) => {
    // Skip chrome internal pages as they can't be scripted
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
    }

    const div = document.createElement('div');
    div.className = 'tab-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `tab-${index}`;
    checkbox.value = tab.id;
    // Default to checked
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `tab-${index}`;
    // Truncate title if too long
    const title = tab.title.length > 40 ? tab.title.substring(0, 40) + '...' : tab.title;
    label.textContent = title;

    div.appendChild(checkbox);
    div.appendChild(label);

    ui.tabList.appendChild(div);
  });

  if (ui.tabList.innerHTML === '') {
      ui.tabList.innerHTML = '<p>No summarizable tabs found.</p>';
      ui.summarizeSelectedBtn.disabled = true;
  } else {
      ui.summarizeSelectedBtn.disabled = false;
  }
}

/**
 * Cancels tab selection mode
 */
function handleCancelSelection() {
  ui.tabSelectionSection.classList.add('hidden');
  ui.mainActions.classList.remove('hidden');
}

/**
 * Summarize Selected Tabs
 */
async function handleSummarizeSelectedTabs() {
  if (!currentApiKey) {
    showError('Please set your Gemini API key first.');
    return;
  }

  const checkboxes = ui.tabList.querySelectorAll('input[type="checkbox"]:checked');

  if (checkboxes.length === 0) {
    showError('Please select at least one tab.');
    return;
  }

  const selectedTabIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
  const selectedTabs = openTabs.filter(tab => selectedTabIds.includes(tab.id));

  showLoading(true);

  try {
    await processTabsForSummarization(selectedTabs);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}

/**
 * Shared logic to extract content from multiple tabs and send to Gemini
 */
async function processTabsForSummarization(tabs) {
  let combinedContent = "";
  let processedCount = 0;

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    ui.loadingIndicator.querySelector('span').textContent = `Processing tab ${i + 1} of ${tabs.length}...`;

    const data = await extractContentFromTab(tab);

    if (data.success && data.content) {
      processedCount++;
      // Limit per-tab content to fit multiple in the context window
      const maxPerTab = Math.floor(window.MAX_CHAR_LIMIT / tabs.length);
      const cleanText = window.truncateText(data.content, maxPerTab);

      combinedContent += `\n\nTAB ${processedCount} (Title: ${data.title}):\n${cleanText}`;
    }
  }

  if (processedCount === 0) {
    throw new Error('Could not extract content from any of the selected tabs.');
  }

  ui.loadingIndicator.querySelector('span').textContent = 'Generating summary...';

  const prompt = `
You are analyzing multiple webpages.

Provide:

1. Summary of each page
2. Common themes
3. Key differences
4. Overall insights

Content:
${combinedContent}
`;

  const summaryText = await window.callGeminiAPI(currentApiKey, prompt);
  const htmlResponse = window.formatResponseToHTML(summaryText);

  showResults(htmlResponse);
  showLoading(false);

  // If we were in selection mode, go back to main actions but keep results
  if (!ui.tabSelectionSection.classList.contains('hidden')) {
    ui.tabSelectionSection.classList.add('hidden');
    ui.mainActions.classList.remove('hidden');
  }
}

/**
 * Ask Questions Across Tabs
 */
async function handleAskAcrossTabs() {
  if (!currentApiKey) {
    showError('Please set your Gemini API key first.');
    return;
  }

  const question = ui.askInput.value.trim();
  if (!question) {
    showError('Please enter a question.');
    return;
  }

  showLoading(true);

  try {
    // We query all tabs by default for questions, or could use selected if we saved state
    const tabs = await chrome.tabs.query({ currentWindow: true });

    let combinedContent = "";
    let processedCount = 0;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      ui.loadingIndicator.querySelector('span').textContent = `Reading tab ${i + 1} of ${tabs.length}...`;

      const data = await extractContentFromTab(tab);

      if (data.success && data.content) {
        processedCount++;
        const maxPerTab = Math.floor(window.MAX_CHAR_LIMIT / tabs.length);
        const cleanText = window.truncateText(data.content, maxPerTab);
        combinedContent += `\n\nTAB ${processedCount} (Title: ${data.title}):\n${cleanText}`;
      }
    }

    if (processedCount === 0) {
      throw new Error('Could not extract content from any tabs to answer the question.');
    }

    ui.loadingIndicator.querySelector('span').textContent = 'Generating answer...';

    const prompt = `
You are analyzing the following webpages.

Answer the user's question using information from them.

Provide:

SYNTHESIS
AGREEMENTS
DISAGREEMENTS
KEY INSIGHTS

User question:
${question}

Content:
${combinedContent}
`;

    const summaryText = await window.callGeminiAPI(currentApiKey, prompt);
    const htmlResponse = window.formatResponseToHTML(summaryText);

    showResults(htmlResponse);

  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

/**
 * Copies the current summary to the clipboard
 */
function handleCopySummary() {
  const content = ui.resultsContent.innerText;

  navigator.clipboard.writeText(content).then(() => {
    const originalText = ui.copySummaryBtn.textContent;
    ui.copySummaryBtn.textContent = 'Copied!';

    setTimeout(() => {
      ui.copySummaryBtn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showError('Failed to copy to clipboard.');
  });
}
