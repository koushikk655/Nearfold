// Skeleton — shimmering placeholder block. Uses Moti's Skeleton under the
// hood for a tasteful gradient sweep that respects the active theme.
//
// Perceived-performance (Phase 04): show skeletons immediately on query
// start so the screen never flashes empty. We key the shimmer colors off
// theme surfaces so it works in both light and dark.

import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { Skeleton as MotiSkeleton } from 'moti/skeleton';

import { useTheme } from '../theme/useTheme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number | 'round';
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  return (
    <View style={style}>
      <MotiSkeleton
        colorMode={theme.scheme === 'dark' ? 'dark' : 'light'}
        width={width}
        height={height}
        radius={radius}
        backgroundColor={theme.colors.surfaceMuted}
      />
    </View>
  );
}

/** Convenience: a vertical stack of N shimmer lines with a gap. */
export function SkeletonLines({
  count = 3,
  height = 14,
  gap = 8,
  lastWidth = '60%',
}: {
  count?: number;
  height?: number;
  gap?: number;
  lastWidth?: DimensionValue;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height={height}
          width={i === count - 1 ? lastWidth : '100%'}
        />
      ))}
    </View>
  );
}
