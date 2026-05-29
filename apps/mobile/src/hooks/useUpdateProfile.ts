// useUpdateProfile — PATCH /users/me and reflect the change in the auth
// store (so the Profile tab + Avatar update immediately) and the me query.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usersApi, type UpdateProfileInput } from '../api/users';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => usersApi.updateProfile(input),
    onSuccess: (me) => {
      qc.setQueryData(queryKeys.me(), me);
      // Mirror the editable bits into the persisted auth user.
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.setState({
          user: { ...current, name: me.name, role: me.role },
        });
      }
    },
  });
}
