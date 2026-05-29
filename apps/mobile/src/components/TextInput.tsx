// TextInput — labeled input with focus animation, helper/error states,
// and a built-in password toggle variant.
//
// The focus state animates the border color and a faint glow (shadow) on
// focus, using Reanimated for the color interpolation so it's smooth on
// the UI thread, not the JS thread.

import { forwardRef, useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type StyleProp,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/useTheme';
import { durations, easings } from '../motion';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  helper?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  passwordToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  {
    label,
    helper,
    error,
    leadingIcon,
    trailingIcon,
    passwordToggle = false,
    containerStyle,
    onFocus,
    onBlur,
    secureTextEntry,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(!!secureTextEntry || passwordToggle);
  const focus = useSharedValue(0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps['onFocus']>>[0]) => {
      focus.value = withTiming(1, { duration: durations.short, easing: easings.decelerate });
      onFocus?.(e);
    },
    [focus, onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps['onBlur']>>[0]) => {
      focus.value = withTiming(0, { duration: durations.short, easing: easings.accelerate });
      onBlur?.(e);
    },
    [focus, onBlur],
  );

  const animatedBorder = useAnimatedStyle(() => {
    const borderColor = error
      ? theme.colors.inputBorderError
      : interpolateColor(
          focus.value,
          [0, 1],
          [theme.colors.inputBorder, theme.colors.inputBorderFocus],
        );
    return { borderColor };
  });

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[theme.type.label, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
          {label}
        </Text>
      ) : null}

      <AnimatedView
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.inputBg,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
            minHeight: 52,
          },
          animatedBorder,
        ]}
      >
        {leadingIcon ? <View style={styles.iconLeading}>{leadingIcon}</View> : null}

        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            theme.type.body,
            { color: theme.colors.text },
          ]}
          placeholderTextColor={theme.colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={passwordToggle ? hidden : secureTextEntry}
          selectionColor={theme.colors.accent}
          {...rest}
        />

        {passwordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
          >
            <Text style={[theme.type.labelSm, { color: theme.colors.accent }]}>
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : trailingIcon ? (
          <View style={styles.iconTrailing}>{trailingIcon}</View>
        ) : null}
      </AnimatedView>

      {(error || helper) ? (
        <Text
          style={[
            theme.type.caption,
            {
              color: error ? theme.colors.danger : theme.colors.textTertiary,
              marginTop: theme.spacing.xxs,
            },
          ]}
        >
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    paddingVertical: 0, // RN adds vertical padding on Android by default
  },
  iconLeading: {
    marginRight: 8,
  },
  iconTrailing: {
    marginLeft: 8,
  },
});
