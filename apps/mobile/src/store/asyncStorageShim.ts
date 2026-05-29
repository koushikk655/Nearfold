// Lightweight persistent storage for NON-sensitive client state
// (location, theme preference). We deliberately do NOT use SecureStore
// here — Keychain/Keystore round-trips are slow and these values aren't
// secrets.
//
// expo-secure-store is reserved for the auth tokens (see authStore).
// For plain key/value we use a tiny wrapper over expo-file-system-free
// AsyncStorage-compatible API. To avoid pulling in
// @react-native-async-storage just for two small stores, we back this
// with expo-sqlite/kv-store which ships with the Expo SDK.

import Storage from 'expo-sqlite/kv-store';

const shim = {
  getItem: (name: string): Promise<string | null> => Storage.getItemAsync(name),
  setItem: async (name: string, value: string): Promise<void> => {
    await Storage.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await Storage.removeItemAsync(name);
  },
};

export default shim;
