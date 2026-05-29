// Settings → Addresses — full CRUD over the buyer's delivery addresses.
// New addresses pin to the current GPS fix (a full map picker is polish).

import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/useTheme';
import { Button, Card, EmptyState, Skeleton, TextInput } from '../../src/components';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
} from '../../src/hooks/useAddresses';
import { useLocationStore } from '../../src/store/locationStore';

const schema = z.object({
  label: z.string().max(50).optional(),
  addressLine: z.string().min(4, 'Add the full address'),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  pincode: z.string().regex(/^\d{4,10}$/u, '4–10 digit pincode'),
});
type Form = z.infer<typeof schema>;

export default function AddressesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const coords = useLocationStore((s) => s.coords);
  const city = useLocationStore((s) => s.city);
  const [showForm, setShowForm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { label: 'Home', addressLine: '', city: city ?? '', state: '', pincode: '' },
  });

  const addresses = data ?? [];

  const onSave = async (form: Form) => {
    if (!coords) {
      Alert.alert('Location needed', 'Enable location so we can pin this address.');
      return;
    }
    await createAddress.mutateAsync({ ...form, latitude: coords.lat, longitude: coords.lng });
    reset();
    setShowForm(false);
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete address?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[theme.type.h3, { color: theme.colors.text }]}>Addresses</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing['4xl'] }}>
        {isLoading ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} height={72} radius={theme.radii.lg} />
            ))}
          </View>
        ) : addresses.length === 0 && !showForm ? (
          <EmptyState emoji="🏠" title="No addresses yet" body="Add where you’d like your orders delivered." actionLabel="Add address" onAction={() => setShowForm(true)} />
        ) : (
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            {addresses.map((addr) => (
              <Card key={addr.id} variant="outlined">
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.accent} style={{ marginRight: 10, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    {addr.label ? <Text style={[theme.type.label, { color: theme.colors.text }]}>{addr.label}</Text> : null}
                    <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                      {addr.addressLine}, {addr.city}, {addr.state} {addr.pincode}
                    </Text>
                  </View>
                  <Pressable onPress={() => onDelete(addr.id)} hitSlop={8} accessibilityLabel="Delete address">
                    <Ionicons name="trash-outline" size={18} color={theme.colors.textTertiary} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {showForm ? (
          <Card variant="elevated" style={{ marginTop: theme.spacing.md }}>
            <View style={{ gap: theme.spacing.sm }}>
              <Controller control={control} name="label" render={({ field: { value, onChange } }) => (
                <TextInput label="Label" placeholder="Home, Work…" value={value} onChangeText={onChange} />
              )} />
              <Controller control={control} name="addressLine" render={({ field: { value, onChange } }) => (
                <TextInput label="Address" placeholder="Flat, building, street, landmark" value={value} onChangeText={onChange} error={errors.addressLine?.message} />
              )} />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Controller control={control} name="city" render={({ field: { value, onChange } }) => (
                  <TextInput label="City" value={value} onChangeText={onChange} error={errors.city?.message} containerStyle={{ flex: 1 }} />
                )} />
                <Controller control={control} name="pincode" render={({ field: { value, onChange } }) => (
                  <TextInput label="Pincode" keyboardType="number-pad" value={value} onChangeText={onChange} error={errors.pincode?.message} containerStyle={{ flex: 1 }} />
                )} />
              </View>
              <Controller control={control} name="state" render={({ field: { value, onChange } }) => (
                <TextInput label="State" value={value} onChangeText={onChange} error={errors.state?.message} />
              )} />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Button label="Cancel" variant="ghost" onPress={() => { reset(); setShowForm(false); }} />
                <Button label="Save" onPress={handleSubmit(onSave)} loading={createAddress.isPending} style={{ flex: 1 }} fullWidth />
              </View>
            </View>
          </Card>
        ) : addresses.length > 0 ? (
          <Pressable onPress={() => setShowForm(true)} style={{ paddingVertical: theme.spacing.md }}>
            <Text style={[theme.type.label, { color: theme.colors.accent }]}>+ Add a new address</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
});
