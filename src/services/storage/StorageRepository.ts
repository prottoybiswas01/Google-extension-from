import { FormHistoryRecord, ExtensionSettings, ExtensionBackupData } from '../../types';
import { DEFAULT_SETTINGS } from '../../utils/storage';

/**
 * StorageRepository - Native IndexedDB wrapper for TTC Form Auto Fill.
 * Strictly avoids LocalStorage as per Phase 5 requirements.
 */

const DB_NAME = 'TTCFormAutoFillDB';
const DB_VERSION = 1;

const STORE_HISTORY = 'history';
const STORE_SETTINGS = 'settings';

export class StorageRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[StorageRepository] IndexedDB open error:', request.error);
        reject(request.error || new Error('Failed to open IndexedDB database.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // History Store
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('status', 'status', { unique: false });
          historyStore.createIndex('institution', 'institution', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Adds a new form extraction history record to IndexedDB.
   */
  async addHistoryRecord(record: FormHistoryRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves all form extraction history records sorted descending by date.
   */
  async getAllHistoryRecords(): Promise<FormHistoryRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as FormHistoryRecord[]) || [];
        records.sort((a, b) => b.timestamp - a.timestamp);
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Deletes a single history record by ID.
   */
  async deleteHistoryRecord(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clears all history records from IndexedDB.
   */
  async clearAllHistory(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Saves settings to IndexedDB.
   */
  async saveSettingsDB(settings: ExtensionSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'main_settings', value: settings });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Loads settings from IndexedDB.
   */
  async getSettingsDB(): Promise<ExtensionSettings> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('main_settings');

      req.onsuccess = () => {
        const item = req.result as { value?: ExtensionSettings } | undefined;
        resolve({
          ...DEFAULT_SETTINGS,
          ...item?.value,
        });
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Exports full IndexedDB data package for Backup.
   */
  async exportBackup(): Promise<ExtensionBackupData> {
    const history = await this.getAllHistoryRecords();
    const settings = await this.getSettingsDB();

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings,
      history,
    };
  }

  /**
   * Imports full IndexedDB backup data package.
   */
  async importBackup(backup: ExtensionBackupData): Promise<void> {
    if (!backup || !backup.history || !Array.isArray(backup.history)) {
      throw new Error('Invalid backup file format.');
    }

    const db = await this.getDB();

    // Import settings
    if (backup.settings) {
      await this.saveSettingsDB(backup.settings);
    }

    // Import history items
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);

    for (const record of backup.history) {
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storageRepository = new StorageRepository();
