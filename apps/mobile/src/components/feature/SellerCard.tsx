// SellerCard — a tappable seller row for the discovery feed.
//
// Layout: square image on the left (blur-up via expo-image), shop name +
// category + rating + distance/ETA on the right. A small "Closed" scrim
// when the seller isn't open. Editorial weight on the shop name (serif),
// functional meta in sans/mono.

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '../../theme/useTheme';
import { Card } from '../Card';
import { Rating } from '../Rating';
import { formatDistance, formatPaise } from '../../lib/format';
import type { NearbySeller } from '../../api/types';

// Tiny blurhash so the image area never flashes a hard rectangle.
const BLUR = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export interface SellerCardProps {
  seller: NearbySeller;
  onPress: () => void;
}

function categoryImage(category: string | null): string | undefined {
  // Sellers don't carry a cover image in the discovery payload yet, so we
  // fall back to a category-keyed Unsplash source. Replace with the
  // seller's real cover once the backend includes it.
  if (!category) return undefined;
  const q = encodeURIComponent(`${category} food homemade`);
  return `https://source.unsplash.com/160x160/?${q}`;
}

export const SellerCard = memo(function SellerCard({ seller, onPress }: SellerCardProps) {
  const theme = useTheme();
  const img = categoryImage(seller.category);

  return (
    <Card variant="elevated" padding="sm" onPress={onPress} radius="xl">
      <View style={styles.row}>
        <View style={{ width: 76, height: 76, borderRadius: theme.radii.lg, overflow: 'hidden' }}>
          <Image
            source={img ? { uri: img } : undefined}
            placeholder={{ blurhash: BLUR }}
            contentFit="cover"
            transition={250}
            style={StyleSheet.absoluteFill}
          />
          {!seller.isOpen ? (
            <View style={[StyleSheet.absoluteFill, styles.closedScrim, { backgroundColor: theme.colors.scrim }]}>
              <Text style={[theme.type.labelSm, { color: '#fff' }]}>Closed</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={[theme.type.h4, { color: theme.colors.text, flex: 1 }]}
              numberOfLines={1}
            >
              {seller.shopName}
            </Text>
            <Rating rating={seller.rating} totalOrders={seller.totalOrders} size="sm" style={{ marginLeft: 8 }} />
          </View>

          {seller.category ? (
            <Text
              style={[theme.type.bodySm, { color: theme.colors.textSecondary, marginTop: 2 }]}
              numberOfLines={1}
            >
              {seller.category}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs, flexWrap: 'wrap' }}>
            <Meta text={formatDistance(seller.distanceMeters)} />
            {seller.minOrderAmount > 0 ? (
              <>
                <Dot />
                <Meta text={`min ${formatPaise(seller.minOrderAmount)}`} />
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
});

function Meta({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>{text}</Text>
  );
}

function Dot() {
  const theme = useTheme();
  return (
    <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginHorizontal: 6 }]}>·</Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  closedScrim: { alignItems: 'center', justifyContent: 'center' },
});
