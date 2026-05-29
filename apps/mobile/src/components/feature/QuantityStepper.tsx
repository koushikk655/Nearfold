// QuantityStepper — − [n] + control. Used on the product detail and in the
// cart. Haptic on each tap; disables − at the min (default removes at 0 via
// onChange). Reanimated count pop for a touch of life.

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MotiText } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/useTheme';
import { springs } from '../../motion';

export interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
  disabled = false,
  style,
}: QuantityStepperProps) {
  const theme = useTheme();
  const dim = size === 'sm' ? 30 : 38;
  const fontSize = size === 'sm' ? 16 : 18;

  const step = (delta: number) => {
    if (disabled) return;
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(next);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <StepBtn label="−" onPress={() => step(-1)} dim={dim} fontSize={fontSize} theme={theme} disabled={value <= min} />
      <MotiText
        key={value}
        from={{ scale: 0.7, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', ...springs.snappy }}
        style={{
          minWidth: dim,
          textAlign: 'center',
          fontFamily: theme.fontFamilies.mono.medium,
          fontSize,
          color: theme.colors.text,
        }}
      >
        {value}
      </MotiText>
      <StepBtn label="+" onPress={() => step(1)} dim={dim} fontSize={fontSize} theme={theme} disabled={value >= max} />
    </View>
  );
}

function StepBtn({
  label,
  onPress,
  dim,
  fontSize,
  theme,
  disabled,
}: {
  label: string;
  onPress: () => void;
  dim: number;
  fontSize: number;
  theme: ReturnType<typeof useTheme>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Increase quantity' : 'Decrease quantity'}
      hitSlop={6}
      style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text
        style={{
          fontSize: fontSize + 2,
          lineHeight: fontSize + 4,
          color: disabled ? theme.colors.textTertiary : theme.colors.accent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignSelf: 'flex-start',
  },
});
