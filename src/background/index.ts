import { ExtensionMessage, ExtensionResponse } from '../types';

/**
 * TTC Form Auto Fill - Background Service Worker (Phase 1)
 * Set up message listener for inter-component communication.
 * Business logic will be attached in Phase 2.
 */

console.log('[TTC Background] Service worker initialized.');

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ): boolean => {
    console.log('[TTC Background] Message received:', message.action);

    switch (message.action) {
      case 'PING':
        sendResponse({ success: true, data: { message: 'PONG from TTC Service Worker' } });
        break;

      case 'GET_SETTINGS':
      case 'SAVE_SETTINGS':
        // Standard handler acknowledgment for Phase 1
        sendResponse({ success: true, data: { status: 'acknowledged' } });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action type' });
        break;
    }

    // Return true to indicate asynchronous response capability
    return true;
  }
);
