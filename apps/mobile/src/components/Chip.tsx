// Chip — selectable / removable / icon variants in sm and md sizes.
// Selected state uses Saffron accent fill; unselected is a soft outline.
// Selection animates fill + label color, dismissal ships a small haptic.

import { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/useTheme';
import { durations, springs } from '../motion';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  size?: ChipSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  size = 'md',
  disabled = false,
  style,
}: ChipProps) {
  const theme = useTheme();

  const dims = useMemo(() => {
    if (size === 'sm') {
      return {
        paddingV: theme.spacing.xxs,
        paddingH: theme.spacing.sm,
        minHeight: 28,
        type: theme.type.labelSm,
      };
    }
    return {
      paddingV: theme.spacing.xs,
      paddingH: theme.spacing.md,
      minHeight: 36,
      type: theme.type.label,
    };
  }, [theme, size]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    void Haptics.selectionAsync();
    onPress?.();
  }, [disabled, onPress]);

  const handleRemove = useCallback(() => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  }, [disabled, onRemove]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={style}
    >
      <MotiView
        animate={{
          backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        }}
        transition={{ type: 'timing', duration: durations.short }}
        style={[
          styles.row,
          {
            paddingVertical: dims.paddingV,
            paddingHorizontal: dims.paddingH,
            minHeight: dims.minHeight,
            borderRadius: theme.radii.pill,
            borderWidth: StyleSheet.hairlineWidth * 2,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {icon ? <View style={{ marginRight: theme.spacing.xxs }}>{icon}</View> : null}
        <Text
          style={[
            dims.type,
            { color: selected ? theme.colors.textOnAccent : theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {onRemove ? (
          <Pressable
            onPress={handleRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
            style={{ marginLeft: theme.spacing.xs }}
          >
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '0deg' }}
              transition={{ type: 'spring', ...springs.snappy }}
            >
              <Text
                style={[
                  dims.type,
                  {
                    color: selected ? theme.colors.textOnAccent : theme.colors.textSecondary,
                    fontSize: dims.type.fontSize + 2,
                    lineHeight: dims.type.fontSize + 2,
                  },
                ]}
              >
                ×
              </Text>
            </MotiView>
          </Pressable>
        ) : null}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
