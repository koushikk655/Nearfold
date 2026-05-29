// Shop page — a seller's storefront. Hero (cover + name + rating + open
// state), an info strip (min order, ETA, today's hours), then the product
// grid. Week 4 wires the grid's add buttons to the cart (optimistic, with
// single-seller 409 handling) and floats the CartBar.

import { useMemo } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../src/theme/useTheme';
import { CartBar, EmptyState, ProductCard, Rating, Skeleton } from '../../../src/components';
import { sellersApi } from '../../../src/api/sellers';
import { productsApi } from '../../../src/api/products';
import { queryKeys } from '../../../src/lib/queryKeys';
import { formatPaise, formatTime } from '../../../src/lib/format';
import { useCart, useAddToCartWithConflict } from '../../../src/hooks/useCart';
import type { BusinessHour, Product } from '../../../src/api/types';

const COVER_BLUR = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';
const SCREEN_W = Dimensions.get('window').width;

export default function ShopScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sellerId = String(id);

  const sellerQ = useQuery({ queryKey: queryKeys.seller(sellerId), queryFn: () => sellersApi.get(sellerId) });
  const hoursQ = useQuery({ queryKey: queryKeys.sellerHours(sellerId), queryFn: () => sellersApi.hours(sellerId) });
  const productsQ = useQuery({ queryKey: queryKeys.sellerProducts(sellerId), queryFn: () => productsApi.bySeller(sellerId) });

  const { data: cart } = useCart();
  const { tryAdd, clearThenAdd } = useAddToCartWithConflict();

  const gap = theme.spacing.md;
  const colW = (SCREEN_W - theme.spacing.lg * 2 - gap) / 2;

  const todayHours = useMemo(() => {
    const today = new Date().getDay();
    return (hoursQ.data ?? []).find((h: BusinessHour) => h.dayOfWeek === today) ?? null;
  }, [hoursQ.data]);

  const qtyFor = (productId: string) =>
    cart?.items.find((i) => i.productId === productId)?.quantity ?? 0;

  const onAdd = async (product: Product) => {
    const res = await tryAdd({ productId: product.id, quantity: 1, name: product.name, unitPrice: product.price });
    if (res.ok || res.reason !== 'different-seller') {
      if (!res.ok && res.reason === 'error') {
        Alert.alert('Couldn’t add', 'Something went wrong. Try again.');
      }
      return;
    }
    Alert.alert(
      'Start a new cart?',
      'Your cart has items from another shop. Nearfold delivers one shop at a time — clear it and add this instead?',
      [
        { text: 'Keep current', style: 'cancel' },
        {
          text: 'Clear & add',
          style: 'destructive',
          onPress: () => clearThenAdd({ productId: product.id, quantity: 1, name: product.name, unitPrice: product.price }),
        },
      ],
    );
  };

  if (sellerQ.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <BackButton onPress={() => router.back()} theme={theme} />
        <EmptyState emoji="🚪" title="Shop not found" body="This maker may have closed up or the link is stale." actionLabel="Go back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  const seller = sellerQ.data;

  const Header = (
    <View>
      <View style={{ height: 200, backgroundColor: theme.colors.surfaceMuted }}>
        <Image
          source={seller?.category ? { uri: `https://source.unsplash.com/800x500/?${encodeURIComponent(seller.category + ' homemade food')}` } : undefined}
          placeholder={{ blurhash: COVER_BLUR }}
          contentFit="cover"
          transition={300}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim, opacity: 0.25 }]} />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
          <BackButton onPress={() => router.back()} theme={theme} floating />
        </SafeAreaView>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
        {seller ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={[theme.type.h1, { color: theme.colors.text, flex: 1 }]}>{seller.shopName}</Text>
              <View style={[styles.openPill, { backgroundColor: seller.isOpen ? theme.colors.successSoft : theme.colors.surfaceMuted }]}>
                <Text style={[theme.type.labelSm, { color: seller.isOpen ? theme.colors.success : theme.colors.textTertiary }]}>
                  {seller.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
              <Rating rating={seller.rating} totalOrders={seller.totalOrders} />
              {seller.category ? (
                <>
                  <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginHorizontal: 8 }]}>·</Text>
                  <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary }]}>{seller.category}</Text>
                </>
              ) : null}
            </View>

            {seller.shopDescription ? (
              <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
                {seller.shopDescription}
              </Text>
            ) : null}

            <View style={[styles.infoStrip, { borderColor: theme.colors.border, marginTop: theme.spacing.md }]}>
              <Info icon="navigate-outline" label={`Within ${seller.deliveryRadiusKm} km`} theme={theme} />
              <InfoDivider theme={theme} />
              <Info icon="bag-handle-outline" label={seller.minOrderAmount > 0 ? `Min ${formatPaise(seller.minOrderAmount)}` : 'No minimum'} theme={theme} />
              <InfoDivider theme={theme} />
              <Info
                icon="calendar-outline"
                label={todayHours ? (todayHours.isClosed ? 'Closed today' : `${formatTime(todayHours.openTime)}–${formatTime(todayHours.closeTime)}`) : '—'}
                theme={theme}
              />
            </View>
          </>
        ) : (
          <View style={{ gap: 10 }}>
            <Skeleton height={32} width="70%" />
            <Skeleton height={16} width="40%" />
            <Skeleton height={64} radius={theme.radii.lg} />
          </View>
        )}

        <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
          MENU
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={[]}>
      <FlashList
        data={productsQ.data ?? []}
        numColumns={2}
        keyExtractor={(p: Product) => p.id}
        estimatedItemSize={colW + 60}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: colW,
              marginLeft: index % 2 === 0 ? theme.spacing.lg : gap / 2,
              marginRight: index % 2 === 0 ? gap / 2 : theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <ProductCard
              product={item}
              width={colW}
              onPress={() => router.push(`/product/${item.id}`)}
              onAdd={() => onAdd(item)}
              inCartQty={qtyFor(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          productsQ.isLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.spacing.lg, gap }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width={colW} height={colW} radius={theme.radii.lg} />
              ))}
            </View>
          ) : (
            <EmptyState emoji="🍽️" title="No items yet" body="This maker hasn’t listed anything yet. Check back soon." />
          )
        }
      />
      <CartBar />
    </SafeAreaView>
  );
}

function BackButton({ onPress, theme, floating }: { onPress: () => void; theme: ReturnType<typeof useTheme>; floating?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={10}
      style={[styles.backBtn, { margin: theme.spacing.md, backgroundColor: floating ? theme.colors.surface : theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
    >
      <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
    </Pressable>
  );
}

function Info({ icon, label, theme }: { icon: keyof typeof Ionicons.glyphMap; label: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={18} color={theme.colors.accent} />
      <Text style={[theme.type.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function InfoDivider({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider }} />;
}

const styles = StyleSheet.create({
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  openPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginLeft: 8 },
  infoStrip: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingVertical: 12 },
});
