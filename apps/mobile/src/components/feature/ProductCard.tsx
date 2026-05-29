// ProductCard — grid tile for the shop page product list.
//
// Square image with blur-up, name, price. An optional "Add" affordance
// (used on the shop page) or a quantity badge when already in cart. The
// add button is wired in Week 4 via the cart store; here it accepts an
// onAdd callback so the shop page can pass it.

import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/useTheme';
import { Price } from '../Price';
import { springs } from '../../motion';
import type { Product } from '../../api/types';

const BLUR = 'L9AB*A%M00xu_3xuofIU00M{~qof';

export interface ProductCardProps {
  product: Product;
  width: number;
  onPress: () => void;
  onAdd?: () => void;
  /** Quantity currently in cart, if any — renders a badge instead of +. */
  inCartQty?: number;
}

export const ProductCard = memo(function ProductCard({
  product,
  width,
  onPress,
  onAdd,
  inCartQty,
}: ProductCardProps) {
  const theme = useTheme();
  const cover = product.images?.[0];
  const soldOut =
    !product.isAvailable ||
    (product.trackInventory && (product.stockQuantity ?? 0) <= 0);

  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: theme.radii.lg,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceMuted,
        }}
      >
        <Image
          source={cover ? { uri: cover } : undefined}
          placeholder={{ blurhash: BLUR }}
          contentFit="cover"
          transition={250}
          style={StyleSheet.absoluteFill}
        />

        {soldOut ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: theme.colors.scrim }]}>
            <Text style={[theme.type.label, { color: '#fff' }]}>Sold out</Text>
          </View>
        ) : null}

        {/* Add affordance */}
        {onAdd && !soldOut ? (
          <View style={styles.addWrap}>
            {inCartQty && inCartQty > 0 ? (
              <View style={[styles.qtyBadge, { backgroundColor: theme.colors.accent }]}>
                <Text style={[theme.type.labelSm, { color: theme.colors.textOnAccent }]}>
                  {inCartQty}
                </Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                onPress={(e) => {
                  e.stopPropagation?.();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAdd();
                }}
                hitSlop={8}
              >
                <MotiView
                  from={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', ...springs.snappy }}
                  style={[
                    styles.addBtn,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Text style={{ color: theme.colors.accent, fontSize: 20, lineHeight: 22 }}>+</Text>
                </MotiView>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>

      <Text
        style={[theme.type.label, { color: theme.colors.text, marginTop: theme.spacing.xs }]}
        numberOfLines={1}
      >
        {product.name}
      </Text>
      <Price paise={product.price} size="sm" style={{ marginTop: 2 }} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  addWrap: { position: 'absolute', right: 8, bottom: 8 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
