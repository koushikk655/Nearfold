// Typography — every type token in the ramp. The label shows the family
// + size + line-height so designers can spot-check vs the v1.2 spec.

import { Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { Section, StoryFrame } from '../StoryFrame';
import type { TypeToken } from '../../theme';

const SAMPLES: Record<TypeToken, string> = {
  display: 'Five blocks away.',
  h1: 'Tiffin from Aunty',
  h2: 'Discover your street',
  h3: 'Today’s makers',
  h4: 'Recommended for you',
  pullQuote: '“My aloo paratha is famous on this lane.”',
  bodyLg: 'A larger body size for hero copy that needs room to breathe.',
  body: 'Standard body. Inter at 16. Reads well on small handsets and dense list rows.',
  bodySm: 'Smaller meta body — captions, helper text, secondary details.',
  caption: 'CAPTION · METADATA',
  label: 'Label text',
  labelSm: 'LABEL SM',
  buttonLg: 'Order tiffin',
  button: 'Save for later',
  buttonSm: 'Skip',
  mono: 'NF-2026-0042  ₹ 240',
  monoSm: 'order_id 7c4a',
};

const SERIF: TypeToken[] = ['display', 'h1', 'h2', 'h3', 'h4', 'pullQuote'];
const SANS: TypeToken[] = [
  'bodyLg',
  'body',
  'bodySm',
  'caption',
  'label',
  'labelSm',
  'buttonLg',
  'button',
  'buttonSm',
];
const MONO: TypeToken[] = ['mono', 'monoSm'];

export function TypographyStory() {
  const theme = useTheme();

  return (
    <StoryFrame
      title="Typography"
      description="Fraunces serif (editorial / warm) · Inter sans (functional / UI) · JetBrains Mono (numerics / IDs)."
    >
      <Section label="Fraunces (serif)">
        {SERIF.map((token) => (
          <Sample key={token} token={token} />
        ))}
      </Section>
      <Section label="Inter (sans)">
        {SANS.map((token) => (
          <Sample key={token} token={token} />
        ))}
      </Section>
      <Section label="JetBrains Mono">
        {MONO.map((token) => (
          <Sample key={token} token={token} />
        ))}
      </Section>
      <Text
        style={[
          theme.type.caption,
          { color: theme.colors.textTertiary, marginTop: theme.spacing.md },
        ]}
      >
        Drop the .ttf files into apps/mobile/assets/fonts before first run — see assets/fonts/README.
      </Text>
    </StoryFrame>
  );
}

function Sample({ token }: { token: TypeToken }) {
  const theme = useTheme();
  const style = theme.type[token];
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={[
          theme.type.monoSm,
          { color: theme.colors.textTertiary, marginBottom: theme.spacing.xxs },
        ]}
      >
        {token} · {style.fontSize}/{style.lineHeight}
      </Text>
      <Text style={[style, { color: theme.colors.text }]}>{SAMPLES[token]}</Text>
    </View>
  );
}
