// Cart — line items with steppers, server-recalculated totals, single-
// seller context, minimum-order gate, and the entry point to checkout.
//
// The cart is one-seller-at-a-time (backend-enforced). We fetch the seller
// for its name + minOrderAmount so we can gate checkout with a friendly
// "add ₹X more to order from <shop>".

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/useTheme';
import { Button, EmptyState, Price, Skeleton, QuantityStepper } from '../../src/components';
import { sellersApi } from '../../src/api/sellers';
import { queryKeys } from '../../src/lib/queryKeys';
import { formatPaise } from '../../src/lib/format';
import { useCart, useSetCartQuantity, useClearCart } from '../../src/hooks/useCart';

export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useCart();
  const setQty = useSetCartQuantity();
  const clear = useClearCart();

  const sellerId = data?.cart?.sellerId;
  const sellerQ = useQuery({
    queryKey: sellerId ? queryKeys.seller(sellerId) : ['seller', 'none'],
    queryFn: () => sellersApi.get(sellerId!),
    enabled: !!sellerId,
  });

  const items = data?.items ?? [];
  const totals = data?.totals;
  const minOrder = sellerQ.data?.minOrderAmount ?? 0;
  const subtotal = totals?.subtotal ?? 0;
  const belowMin = minOrder > 0 && subtotal < minOrder;
  const shortfall = Math.max(0, minOrder - subtotal);

  const onClear = () => {
    Alert.alert('Empty cart?', 'Remove everything from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Empty cart', style: 'destructive', onPress: () => clear.mutate() },
    ]);
  };

  // ── Empty ────────────────────────────────────────────────────────
  if (!isLoading && items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <Header title="Your cart" onBack={() => router.back()} theme={theme} />
        <EmptyState
          emoji="🧺"
          title="Cart’s empty"
          body="Find something delicious nearby and it’ll show up here."
          actionLabel="Browse makers"
          onAction={() => router.replace('/home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <Header
        title="Your cart"
        onBack={() => router.back()}
        theme={theme}
        right={
          items.length > 0 ? (
            <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Empty cart">
              <Text style={[theme.type.label, { color: theme.colors.danger }]}>Clear</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 220 }}
      >
        {/* Seller banner */}
        {sellerQ.data ? (
          <Pressable
            onPress={() => router.push(`/shop/${sellerQ.data!.id}`)}
            style={[styles.sellerRow, { borderColor: theme.colors.border }]}
          >
            <Ionicons name="storefront-outline" size={18} color={theme.colors.accent} />
            <Text style={[theme.type.label, { color: theme.colors.text, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
              {sellerQ.data.shopName}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
          </Pressable>
        ) : null}

        {/* Line items */}
        {isLoading ? (
          <View style={{ gap: 16, marginTop: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={64} radius={theme.radii.lg} />
            ))}
          </View>
        ) : (
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
            {items.map((item) => (
              <View key={item.productId} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[theme.type.label, { color: theme.colors.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Price paise={item.unitPrice} size="sm" color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
                </View>
                <QuantityStepper
                  value={item.quantity}
                  onChange={(next) => setQty.mutate({ productId: item.productId, quantity: next })}
                  min={0}
                  size="sm"
                />
                <View style={{ width: 76, alignItems: 'flex-end' }}>
                  <Price paise={item.lineTotal} size="sm" />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        {totals ? (
          <View style={[styles.totals, { borderTopColor: theme.colors.divider, marginTop: theme.spacing.lg }]}>
            <TotalRow label="Subtotal" paise={totals.subtotal} theme={theme} />
            <TotalRow label="Platform fee" paise={totals.platformFee} theme={theme} />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider, marginVertical: 8 }} />
            <TotalRow label="Total" paise={totals.totalAmount} theme={theme} emphasize />
          </View>
        ) : null}
      </ScrollView>

      {/* Checkout bar */}
      <View
        style={[
          styles.checkoutBar,
          { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        ]}
      >
        {belowMin ? (
          <Text style={[theme.type.caption, { color: theme.colors.warning, marginBottom: 8, textAlign: 'center' }]}>
            Add {formatPaise(shortfall)} more to meet the {formatPaise(minOrder)} minimum
            {sellerQ.data ? ` for ${sellerQ.data.shopName}` : ''}.
          </Text>
        ) : null}
        <Button
          label={belowMin ? `Minimum ${formatPaise(minOrder)}` : 'Proceed to checkout'}
          onPress={() => router.push('/checkout')}
          disabled={belowMin || items.length === 0}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function Header({
  title,
  onBack,
  theme,
  right,
}: {
  title: string;
  onBack: () => void;
  theme: ReturnType<typeof useTheme>;
  right?: React.ReactNode;
}) {
  return (
    <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
      </Pressable>
      <Text style={[theme.type.h3, { color: theme.colors.text, flex: 1 }]}>{title}</Text>
      {right}
    </View>
  );
}

function TotalRow({
  label,
  paise,
  theme,
  emphasize,
}: {
  label: string;
  paise: number;
  theme: ReturnType<typeof useTheme>;
  emphasize?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={[emphasize ? theme.type.h4 : theme.type.body, { color: emphasize ? theme.colors.text : theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Price paise={paise} size={emphasize ? 'md' : 'sm'} color={emphasize ? theme.colors.text : theme.colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    marginTop: 12,
  },
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  totals: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
