// Card — elevated, outlined, or flat. Optional `onPress` makes it
// pressable with a tasteful scale animation on press.

import { forwardRef, useMemo } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/useTheme';
import { springs } from '../motion';
import type { RadiusToken } from '../theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: RadiusToken;
  onPress?: PressableProps['onPress'];
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export const Card = forwardRef<View, CardProps>(function Card(
  {
    variant = 'elevated',
    padding = 'md',
    radius = 'lg',
    onPress,
    haptic = true,
    style,
    children,
    accessibilityLabel,
  },
  ref,
) {
  const theme = useTheme();

  const containerStyle: ViewStyle = useMemo(() => {
    const padMap: Record<CardPadding, number> = {
      none: 0,
      sm: theme.spacing.sm,
      md: theme.spacing.lg,
      lg: theme.spacing.xl,
    };
    const base: ViewStyle = {
      backgroundColor:
        variant === 'flat' ? theme.colors.surfaceMuted : theme.colors.surface,
      borderRadius: theme.radii[radius],
      padding: padMap[padding],
    };
    if (variant === 'outlined') {
      base.borderWidth = 1;
      base.borderColor = theme.colors.border;
    }
    if (variant === 'elevated') {
      Object.assign(base, theme.shadows.sm);
    }
    return base;
  }, [theme, variant, padding, radius]);

  if (onPress) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={(e) => {
          if (haptic) {
            void Haptics.selectionAsync();
          }
          onPress(e);
        }}
        style={style}
      >
        {({ pressed }) => (
          <MotiView
            animate={{ scale: pressed ? 0.985 : 1 }}
            transition={{ type: 'spring', ...springs.snappy }}
            style={containerStyle}
          >
            {children}
          </MotiView>
        )}
      </Pressable>
    );
  }

  return (
    <View ref={ref} style={[containerStyle, style]}>
      {children}
    </View>
  );
});
