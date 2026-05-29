// Settings → Edit profile — name + city. PATCH /users/me; the auth store
// updates so the Profile tab + Avatar reflect the change immediately.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/useTheme';
import { Button, TextInput } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { useUpdateProfile } from '../../src/hooks/useUpdateProfile';

const schema = z.object({
  name: z.string().min(1, 'Tell us your name').max(100),
  city: z.string().max(100).optional(),
});
type Form = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', city: '' },
  });

  const onSave = async (form: Form) => {
    await update.mutateAsync({ name: form.name, city: form.city || undefined });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[theme.type.h3, { color: theme.colors.text }]}>Edit profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.md }}>
          <Controller control={control} name="name" render={({ field: { value, onChange } }) => (
            <TextInput label="Name" placeholder="Your name" value={value} onChangeText={onChange} error={errors.name?.message} autoFocus />
          )} />
          <Controller control={control} name="city" render={({ field: { value, onChange } }) => (
            <TextInput label="City" placeholder="Guwahati, Indore…" value={value} onChangeText={onChange} error={errors.city?.message} />
          )} />
          <View>
            <Text style={[theme.type.label, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>Phone</Text>
            <TextInput value={user?.phone ?? ''} editable={false} />
            <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginTop: 4 }]}>
              Your phone is your login — it can’t be changed here.
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label="Save changes" onPress={handleSubmit(onSave)} loading={update.isPending} disabled={!isDirty} fullWidth size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
});
