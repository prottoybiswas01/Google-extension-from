import { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  aiProvider: 'local_browser',
  ocrProvider: 'tesseract_wasm',
  apiKey: '',
};

const STORAGE_KEY = 'ttc_form_auto_fill_settings';

/**
 * Loads extension settings from chrome.storage.local or localStorage fallback.
 */
export async function getSettings(): Promise<ExtensionSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const stored = result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined;
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
      };
    } else {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData) as Partial<ExtensionSettings>;
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }
    }
  } catch (error) {
    console.error('[TTC Storage] Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Saves extension settings to chrome.storage.local or localStorage fallback.
 */
export async function saveSettings(settings: ExtensionSettings): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    return true;
  } catch (error) {
    console.error('[TTC Storage] Failed to save settings:', error);
    return false;
  }
}
