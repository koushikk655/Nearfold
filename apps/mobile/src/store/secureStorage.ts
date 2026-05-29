// SecureStore-backed adapter for Zustand persist.
//
// expo-secure-store keeps values in:
//   iOS:     Keychain (kSecAttrAccessibleAfterFirstUnlock by default)
//   Android: encrypted SharedPreferences
//
// We use this for the JWT and the cached user record so sensitive material
// never touches AsyncStorage / plain disk.

import * as SecureStore from 'expo-secure-store';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

export function createSecureStorage<T>(): PersistStorage<T> {
  return {
    async getItem(name) {
      const raw = await SecureStore.getItemAsync(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        // Corrupt entry — wipe so we don't loop on a broken state.
        await SecureStore.deleteItemAsync(name);
        return null;
      }
    },
    async setItem(name, value) {
      await SecureStore.setItemAsync(name, JSON.stringify(value));
    },
    async removeItem(name) {
      await SecureStore.deleteItemAsync(name);
    },
  };
}
