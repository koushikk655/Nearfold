// Button — primary / secondary / ghost / destructive in sm/md/lg.
// Tactile: light haptic on press by default (opt-out via `haptic={false}`).
// Animated press scale via Moti for tactile feedback that reads on Android
// where Pressable's visual feedback is otherwise dead.
//
// Design language: Saffron primary, restrained secondary outline, ghost for
// inline actions, destructive for irreversible.

import { forwardRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/useTheme';
import { springs } from '../motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  haptic?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    label,
    variant = 'primary',
    size = 'md',
    loading = false,
    haptic = true,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    disabled,
    onPress,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (isDisabled) return;
      if (haptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(event);
    },
    [isDisabled, haptic, onPress],
  );

  const { container, text } = useMemo(() => {
    const sizeMap: Record<ButtonSize, { paddingV: number; paddingH: number; minHeight: number; typeStyle: TextStyle }> = {
      sm: { paddingV: theme.spacing.xs, paddingH: theme.spacing.md, minHeight: 36, typeStyle: theme.type.buttonSm },
      md: { paddingV: theme.spacing.sm, paddingH: theme.spacing.lg, minHeight: 48, typeStyle: theme.type.button },
      lg: { paddingV: theme.spacing.md, paddingH: theme.spacing.xl, minHeight: 56, typeStyle: theme.type.buttonLg },
    };
    const s = sizeMap[size];

    const variantMap: Record<
      ButtonVariant,
      { bg: string; bgPressed: string; border: string; text: string }
    > = {
      primary: {
        bg: theme.colors.accent,
        bgPressed: theme.colors.accentPressed,
        border: theme.colors.accent,
        text: theme.colors.textOnAccent,
      },
      secondary: {
        bg: 'transparent',
        bgPressed: theme.colors.pressableOverlay,
        border: theme.colors.borderStrong,
        text: theme.colors.text,
      },
      ghost: {
        bg: 'transparent',
        bgPressed: theme.colors.pressableOverlay,
        border: 'transparent',
        text: theme.colors.text,
      },
      destructive: {
        bg: theme.colors.danger,
        bgPressed: theme.colors.dangerSoft,
        border: theme.colors.danger,
        text: '#FFFFFF',
      },
    };
    const v = variantMap[variant];

    return {
      container: {
        paddingVertical: s.paddingV,
        paddingHorizontal: s.paddingH,
        minHeight: s.minHeight,
        backgroundColor: v.bg,
        borderColor: v.border,
        borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth * 2 : 0,
        borderRadius: theme.radii.pill,
        opacity: isDisabled ? 0.5 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      } as ViewStyle,
      text: {
        ...s.typeStyle,
        color: v.text,
      },
    };
  }, [theme, variant, size, isDisabled, fullWidth]);

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={handlePress}
      disabled={isDisabled}
      style={style}
      {...rest}
    >
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed && !isDisabled ? 0.97 : 1 }}
          transition={{ type: 'spring', ...springs.snappy }}
          style={[styles.row, container]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={container.borderColor !== 'transparent' && variant !== 'primary' && variant !== 'destructive' ? theme.colors.text : '#FFFFFF'} />
          ) : (
            <>
              {leadingIcon ? <View style={styles.iconLeading}>{leadingIcon}</View> : null}
              <Text style={text} numberOfLines={1}>
                {label}
              </Text>
              {trailingIcon ? <View style={styles.iconTrailing}>{trailingIcon}</View> : null}
            </>
          )}
        </MotiView>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeading: {
    marginRight: 8,
  },
  iconTrailing: {
    marginLeft: 8,
  },
});
