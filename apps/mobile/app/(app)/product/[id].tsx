// Product detail — full Week 4 version.
//
// - Swipeable image gallery (paged) with dot indicator + blur-up.
// - Sticky bottom action bar that is cart-aware:
//     not in cart → [local qty stepper] [Add · ₹total]
//     in cart     → [cart qty stepper]  [View cart →]
// - Optimistic add via useCart; 409 (different-seller) prompts to clear.

import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../src/theme/useTheme';
import { Button, EmptyState, Price, Skeleton, QuantityStepper } from '../../../src/components';
import { productsApi } from '../../../src/api/products';
import { queryKeys } from '../../../src/lib/queryKeys';
import { formatLeadTime } from '../../../src/lib/format';
import {
  useCartItemQty,
  useAddToCartWithConflict,
  useSetCartQuantity,
} from '../../../src/hooks/useCart';

const SCREEN_W = Dimensions.get('window').width;
const BLUR = 'L9AB*A%M00xu_3xuofIU00M{~qof';

export default function ProductScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = String(id);

  const q = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.get(productId),
  });

  const product = q.data;
  const images = product?.images?.length ? product.images : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [localQty, setLocalQty] = useState(1);

  const cartQty = useCartItemQty(productId);
  const { tryAdd, clearThenAdd, isPending } = useAddToCartWithConflict();
  const setQty = useSetCartQuantity();

  const soldOut =
    product &&
    (!product.isAvailable || (product.trackInventory && (product.stockQuantity ?? 0) <= 0));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  };

  const handleAdd = async () => {
    if (!product) return;
    const res = await tryAdd({
      productId,
      quantity: localQty,
      name: product.name,
      unitPrice: product.price,
    });
    if (res.ok) return;
    if (res.reason === 'different-seller') {
      Alert.alert(
        'Start a new cart?',
        'Your cart has items from another shop. Nearfold delivers one shop at a time — clear it and add this instead?',
        [
          { text: 'Keep current', style: 'cancel' },
          {
            text: 'Clear & add',
            style: 'destructive',
            onPress: () =>
              clearThenAdd({
                productId,
                quantity: localQty,
                name: product.name,
                unitPrice: product.price,
              }),
          },
        ],
      );
    } else {
      Alert.alert('Couldn’t add', 'Something went wrong adding this item. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Gallery */}
        <View style={{ width: SCREEN_W, height: SCREEN_W, backgroundColor: theme.colors.surfaceMuted }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScroll}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  placeholder={{ blurhash: BLUR }}
                  contentFit="cover"
                  transition={250}
                  style={{ width: SCREEN_W, height: SCREEN_W }}
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              placeholder={{ blurhash: BLUR }}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Dots */}
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === activeIdx ? theme.colors.accent : 'rgba(255,255,255,0.7)',
                  }}
                />
              ))}
            </View>
          ) : null}

          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityLabel="Back"
              style={[styles.backBtn, { margin: theme.spacing.md, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Body */}
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          {q.isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={28} width="80%" />
              <Skeleton height={22} width="30%" />
              <Skeleton height={80} />
            </View>
          ) : q.isError || !product ? (
            <EmptyState
              emoji="🔍"
              title="Item not found"
              body="This dish may have been taken off the menu."
              actionLabel="Go back"
              onAction={() => router.back()}
            />
          ) : (
            <>
              <Text style={[theme.type.h2, { color: theme.colors.text }]}>{product.name}</Text>
              <Price paise={product.price} size="lg" style={{ marginTop: theme.spacing.xs }} />

              <View style={[styles.tag, { backgroundColor: theme.colors.accentMuted, marginTop: theme.spacing.sm }]}>
                <Text style={[theme.type.labelSm, { color: theme.colors.accent }]}>
                  {product.isCustomOrder ? '✦ ' : ''}{formatLeadTime(product.leadTimeHours ?? 2)}
                </Text>
              </View>

              {product.description ? (
                <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.lg, lineHeight: 24 }]}>
                  {product.description}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      {product && !q.isError ? (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {soldOut ? (
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
              <Text style={[theme.type.label, { color: theme.colors.textSecondary }]}>Sold out</Text>
            </View>
          ) : cartQty > 0 ? (
            <>
              <QuantityStepper
                value={cartQty}
                onChange={(next) => setQty.mutate({ productId, quantity: next })}
                min={0}
                max={99}
              />
              <Button
                label="View cart →"
                onPress={() => router.push('/cart')}
                style={{ flex: 1, marginLeft: theme.spacing.md }}
                fullWidth
              />
            </>
          ) : (
            <>
              <QuantityStepper value={localQty} onChange={setLocalQty} min={1} max={99} />
              <Button
                label={`Add · ₹${(product.price * localQty) / 100}`}
                onPress={handleAdd}
                loading={isPending}
                style={{ flex: 1, marginLeft: theme.spacing.md }}
                fullWidth
              />
            </>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
