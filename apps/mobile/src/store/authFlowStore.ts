// Ephemeral state for the in-flight OTP flow.
//
// The Firebase confirmation handle returned by signInWithPhoneNumber is
// non-serializable, so we can't pass it through expo-router params.
// Park it here for the OTP screen to read. Reset on success or when the
// user backs out.

import { create } from 'zustand';

import type { PhoneConfirmation } from '../firebase/phoneAuth';

interface AuthFlowState {
  phone: string | null;
  confirmation: PhoneConfirmation | null;
  startedAt: number | null;

  start: (phone: string, confirmation: PhoneConfirmation) => void;
  reset: () => void;
}

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  phone: null,
  confirmation: null,
  startedAt: null,

  start: (phone, confirmation) =>
    set({ phone, confirmation, startedAt: Date.now() }),

  reset: () => set({ phone: null, confirmation: null, startedAt: null }),
}));
