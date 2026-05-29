// Price — renders paise as ₹ in JetBrains Mono (the locked numeric face).
// The ₹ glyph is drawn slightly smaller and lighter than the digits so big
// price displays read as "number first".

import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { paiseToRupeesString } from '../lib/format';

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PriceProps {
  paise: number;
  size?: PriceSize;
  color?: string;
  strikethrough?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<PriceSize, { digit: number; symbol: number }> = {
  sm: { digit: 14, symbol: 11 },
  md: { digit: 17, symbol: 13 },
  lg: { digit: 22, symbol: 16 },
  xl: { digit: 30, symbol: 20 },
};

export function Price({ paise, size = 'md', color, strikethrough, style }: PriceProps) {
  const theme = useTheme();
  const dims = SIZE_MAP[size];
  const tint = color ?? theme.colors.text;

  const base: TextStyle = {
    fontFamily: theme.fontFamilies.mono.medium,
    color: tint,
    textDecorationLine: strikethrough ? 'line-through' : 'none',
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, style]}>
      <Text
        style={[
          base,
          { fontSize: dims.symbol, opacity: 0.7, marginRight: 1 },
        ]}
      >
        ₹
      </Text>
      <Text style={[base, { fontSize: dims.digit }]}>{paiseToRupeesString(paise)}</Text>
    </View>
  );
}
