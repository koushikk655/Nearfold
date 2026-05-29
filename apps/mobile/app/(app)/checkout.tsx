// Checkout — pick a delivery address, choose payment, place the order.
//
// Place-order flow:
//   1. POST /orders → { order, razorpay }
//   2. COD (razorpay === null) → straight to the tracking screen
//   3. Razorpay → open the sheet → POST /payments/verify → tracking screen
//      (on user-cancel the order is left unpaid and we still navigate to
//       tracking so they can retry payment)

import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/useTheme';
import { Button, Card, Price, TextInput } from '../../src/components';
import { useCart } from '../../src/hooks/useCart';
import { useAddresses, useCreateAddress } from '../../src/hooks/useAddresses';
import { useCreateOrder } from '../../src/hooks/useOrders';
import { useAuthStore } from '../../src/store/authStore';
import { useLocationStore } from '../../src/store/locationStore';
import {
  openRazorpayCheckout,
  RazorpayCancelledError,
} from '../../src/payments/razorpay';
import { paymentsApi } from '../../src/api/payments';
import type { PaymentMethod } from '../../src/api/types';

const addressFormSchema = z.object({
  label: z.string().max(50).optional(),
  addressLine: z.string().min(4, 'Add the full address'),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  pincode: z.string().regex(/^\d{4,10}$/u, '4–10 digit pincode'),
});
type AddressForm = z.infer<typeof addressFormSchema>;

export default function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: cart } = useCart();
  const addressesQ = useAddresses();
  const createAddress = useCreateAddress();
  const createOrder = useCreateOrder();
  const user = useAuthStore((s) => s.user);
  const coords = useLocationStore((s) => s.coords);
  const city = useLocationStore((s) => s.city);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('razorpay');
  const [instructions, setInstructions] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);

  const addresses = addressesQ.data ?? [];
  const effectiveAddressId = selectedAddressId ?? addresses[0]?.id ?? null;
  const totals = cart?.totals;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: { label: 'Home', addressLine: '', city: city ?? '', state: '', pincode: '' },
  });

  const onSaveAddress = async (form: AddressForm) => {
    if (!coords) {
      Alert.alert('Location needed', 'We need your location to pin this address. Enable location and try again.');
      return;
    }
    const created = await createAddress.mutateAsync({
      ...form,
      latitude: coords.lat,
      longitude: coords.lng,
    });
    setSelectedAddressId(created.id);
    setShowForm(false);
  };

  const placeOrder = async () => {
    if (!effectiveAddressId) {
      Alert.alert('Pick an address', 'Add a delivery address to continue.');
      return;
    }
    setPlacing(true);
    try {
      const { order, razorpay } = await createOrder.mutateAsync({
        addressId: effectiveAddressId,
        paymentMethod: method,
        specialInstructions: instructions.trim() || undefined,
      });

      if (!razorpay) {
        // COD path — order is placed.
        router.replace(`/order/${order.id}`);
        return;
      }

      try {
        const result = await openRazorpayCheckout({
          keyId: razorpay.keyId,
          orderId: razorpay.orderId,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: 'Nearfold',
          prefillContact: user?.phone ?? undefined,
          themeColor: theme.colors.accent,
        });
        await paymentsApi.verify({
          razorpayOrderId: result.razorpay_order_id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        });
        router.replace(`/order/${order.id}`);
      } catch (payErr) {
        if (payErr instanceof RazorpayCancelledError) {
          Alert.alert('Payment cancelled', 'Your order is held as unpaid. You can retry payment from the order screen.');
        } else {
          Alert.alert('Payment issue', payErr instanceof Error ? payErr.message : 'Try again.');
        }
        router.replace(`/order/${order.id}`);
      }
    } catch (err) {
      Alert.alert('Couldn’t place order', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setPlacing(false);
    }
  };

  const methods = useMemo(
    () =>
      [
        { key: 'razorpay' as const, icon: 'card-outline' as const, title: 'UPI / Cards', sub: 'Pay now via Razorpay' },
        { key: 'cod' as const, icon: 'cash-outline' as const, title: 'Cash on delivery', sub: 'Pay the maker on arrival' },
      ],
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[theme.type.h3, { color: theme.colors.text }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 200 }}>
        {/* Address */}
        <SectionLabel theme={theme}>DELIVER TO</SectionLabel>
        {addresses.map((addr) => {
          const selected = addr.id === effectiveAddressId;
          return (
            <Pressable key={addr.id} onPress={() => setSelectedAddressId(addr.id)}>
              <Card
                variant={selected ? 'elevated' : 'outlined'}
                style={{
                  marginBottom: theme.spacing.sm,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  borderWidth: selected ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? theme.colors.accent : theme.colors.textTertiary}
                    style={{ marginRight: 10, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    {addr.label ? (
                      <Text style={[theme.type.label, { color: theme.colors.text }]}>{addr.label}</Text>
                    ) : null}
                    <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                      {addr.addressLine}, {addr.city}, {addr.state} {addr.pincode}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}

        {showForm ? (
          <Card variant="outlined" style={{ marginBottom: theme.spacing.sm }}>
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
              <Button label="Save address" onPress={handleSubmit(onSaveAddress)} loading={createAddress.isPending} fullWidth />
            </View>
          </Card>
        ) : (
          <Pressable onPress={() => setShowForm(true)} style={{ paddingVertical: theme.spacing.sm }}>
            <Text style={[theme.type.label, { color: theme.colors.accent }]}>+ Add a new address</Text>
          </Pressable>
        )}

        {/* Payment */}
        <SectionLabel theme={theme}>PAYMENT</SectionLabel>
        {methods.map((m) => {
          const selected = method === m.key;
          return (
            <Pressable key={m.key} onPress={() => setMethod(m.key)}>
              <Card
                variant={selected ? 'elevated' : 'outlined'}
                style={{
                  marginBottom: theme.spacing.sm,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  borderWidth: selected ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={m.icon} size={22} color={theme.colors.accent} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.type.label, { color: theme.colors.text }]}>{m.title}</Text>
                    <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>{m.sub}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? theme.colors.accent : theme.colors.textTertiary}
                  />
                </View>
              </Card>
            </Pressable>
          );
        })}

        {/* Instructions */}
        <SectionLabel theme={theme}>NOTE FOR THE MAKER</SectionLabel>
        <TextInput
          placeholder="Less spicy, ring the bell, leave at gate…"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />

        {/* Summary */}
        {totals ? (
          <View style={{ marginTop: theme.spacing.xl, gap: 4 }}>
            <SummaryRow label="Subtotal" paise={totals.subtotal} theme={theme} />
            <SummaryRow label="Platform fee" paise={totals.platformFee} theme={theme} />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider, marginVertical: 6 }} />
            <SummaryRow label="Total" paise={totals.totalAmount} theme={theme} emphasize />
          </View>
        ) : null}
      </ScrollView>

      {/* Place order */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <Button
          label={
            placing
              ? 'Placing…'
              : method === 'cod'
                ? 'Place order'
                : `Pay ₹${(totals?.totalAmount ?? 0) / 100}`
          }
          onPress={placeOrder}
          loading={placing}
          disabled={!effectiveAddressId || !cart || cart.items.length === 0}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ theme, children }: { theme: ReturnType<typeof useTheme>; children: string }) {
  return (
    <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
      {children}
    </Text>
  );
}

function SummaryRow({ label, paise, theme, emphasize }: { label: string; paise: number; theme: ReturnType<typeof useTheme>; emphasize?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={[emphasize ? theme.type.h4 : theme.type.body, { color: emphasize ? theme.colors.text : theme.colors.textSecondary }]}>{label}</Text>
      <Price paise={paise} size={emphasize ? 'md' : 'sm'} color={emphasize ? theme.colors.text : theme.colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
