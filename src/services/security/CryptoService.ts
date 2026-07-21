/**
 * Security & Encryption Service for API Key Obfuscation & Permission Validation
 */

export class CryptoService {
  private secretSalt = 'TTC_FORM_AUTO_FILL_SECURE_SALT_2026';

  /**
   * Encrypts/obfuscates raw API Key string.
   */
  encryptApiKey(apiKey: string): string {
    if (!apiKey) return '';
    try {
      const combined = `${this.secretSalt}::${apiKey}`;
      return btoa(encodeURIComponent(combined));
    } catch (e) {
      console.error('[CryptoService] Encryption error:', e);
      return apiKey;
    }
  }

  /**
   * Decrypts/deobfuscates stored API Key string.
   */
  decryptApiKey(encrypted: string): string {
    if (!encrypted) return '';
    try {
      const decoded = decodeURIComponent(atob(encrypted));
      if (decoded.startsWith(`${this.secretSalt}::`)) {
        return decoded.replace(`${this.secretSalt}::`, '');
      }
      return encrypted;
    } catch (e) {
      // Return raw string if not base64 encoded
      return encrypted;
    }
  }

  /**
   * Validates required extension runtime permissions.
   */
  async validatePermissions(): Promise<{ valid: boolean; activeTab: boolean; storage: boolean }> {
    if (typeof chrome === 'undefined' || !chrome.permissions) {
      return { valid: true, activeTab: true, storage: true };
    }

    try {
      const hasStorage = await chrome.permissions.contains({ permissions: ['storage'] });
      const hasActiveTab = await chrome.permissions.contains({ permissions: ['activeTab'] });
      return {
        valid: hasStorage && hasActiveTab,
        storage: hasStorage,
        activeTab: hasActiveTab,
      };
    } catch (e) {
      return { valid: true, activeTab: true, storage: true };
    }
  }
}

export const cryptoService = new CryptoService();
