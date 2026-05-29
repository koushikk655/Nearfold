// Rating — a single saffron star + numeric value (e.g. "★ 4.8"), or a
// "New" pill for sellers with no rating yet. Compact by design — used in
// dense card headers, not as an interactive star picker (that's the
// review form's job in Week 8).

import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { formatRating } from '../lib/format';

export interface RatingProps {
  rating: number;
  totalOrders?: number;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Rating({ rating, totalOrders, size = 'md', style }: RatingProps) {
  const theme = useTheme();
  const label = formatRating(rating);
  const isNew = label === 'New';
  const fontSize = size === 'sm' ? 12 : 14;

  if (isNew) {
    return (
      <View
        style={[
          {
            paddingHorizontal: theme.spacing.xs,
            paddingVertical: 2,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.accentMuted,
          },
          style,
        ]}
      >
        <Text
          style={{
            fontFamily: theme.fontFamilies.sans.semibold,
            fontSize: fontSize - 1,
            color: theme.colors.accent,
          }}
        >
          New
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <Text style={{ fontSize, color: theme.colors.accent, marginRight: 3 }}>★</Text>
      <Text
        style={{
          fontFamily: theme.fontFamilies.mono.medium,
          fontSize,
          color: theme.colors.text,
        }}
      >
        {label}
      </Text>
      {totalOrders && totalOrders > 0 ? (
        <Text
          style={{
            fontFamily: theme.fontFamilies.sans.regular,
            fontSize: fontSize - 1,
            color: theme.colors.textTertiary,
            marginLeft: 4,
          }}
        >
          ({totalOrders})
        </Text>
      ) : null}
    </View>
  );
}
