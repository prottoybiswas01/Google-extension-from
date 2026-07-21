import { useState, useEffect, useCallback } from 'react';
import { ExtensionSettings } from '../types';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/storage';

export interface UseExtensionSettingsReturn {
  settings: ExtensionSettings;
  isLoading: boolean;
  isSaving: boolean;
  saveStatusMessage: string | null;
  updateSettings: (newSettings: ExtensionSettings) => Promise<boolean>;
  resetSettings: () => Promise<void>;
}

export function useExtensionSettings(): UseExtensionSettingsReturn {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      const loaded = await getSettings();
      if (isMounted) {
        setSettings(loaded);
        setIsLoading(false);
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: ExtensionSettings): Promise<boolean> => {
    setIsSaving(true);
    setSaveStatusMessage(null);
    const success = await saveSettings(newSettings);
    if (success) {
      setSettings(newSettings);
      setSaveStatusMessage('Settings saved successfully!');
    } else {
      setSaveStatusMessage('Failed to save settings.');
    }
    setIsSaving(false);
    return success;
  }, []);

  const resetSettings = useCallback(async (): Promise<void> => {
    await updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    saveStatusMessage,
    updateSettings,
    resetSettings,
  };
}
