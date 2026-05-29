// Address hooks — list / create / update / delete. Used by checkout
// (list + create) and the Settings → Addresses screen (full CRUD).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addressesApi, type AddressInput } from '../api/addresses';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useAddresses() {
  const authed = !!useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: addressesApi.list,
    enabled: authed,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => addressesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
      addressesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}
