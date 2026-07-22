import { ExtensionMessage, ExtensionResponse, ExtractedFormData } from '../types';
import { formFiller } from './formFiller';

console.log('[TTC Content Script] Loaded and ready for web form auto-fill.');

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage<ExtractedFormData>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ): boolean => {
    console.log('[TTC Content Script] Received message action:', message.action);

    if (message.action === 'FILL_WEB_FORM') {
      try {
        const formData = message.payload;
        if (!formData) {
          sendResponse({ success: false, error: 'No form payload provided.' });
          return false;
        }

        const result = formFiller.fillWebForm(formData);

        sendResponse({
          success: true,
          data: {
            totalFieldsFilled: result.totalFieldsFilled,
            filledFields: result.filledFields,
          },
        });
      } catch (err) {
        console.error('[TTC Content Script] Auto fill error:', err);
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown auto fill error',
        });
      }
    }

    return true;
  }
);
