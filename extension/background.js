/**
 * Background Service Worker for AI Tab Summarizer
 *
 * Required for Manifest V3 extension structure.
 * Currently, all logic is handled in popup.js, but this file is kept
 * for potential future background tasks (like background summarization).
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Tab Summarizer installed.');
});
