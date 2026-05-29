// Colors — every token in the active palette as a swatch grid. Renders
// against whichever theme is currently active so dark / light parity is
// visible by cycling the theme toggle.

import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { Row, Section, StoryFrame } from '../StoryFrame';

const SURFACE_TOKENS = [
  'bg',
  'surface',
  'surfaceElevated',
  'surfaceMuted',
  'overlay',
  'scrim',
] as const;
const TEXT_TOKENS = [
  'text',
  'textSecondary',
  'textTertiary',
  'textInverse',
  'textOnAccent',
  'placeholder',
] as const;
const ACCENT_TOKENS = [
  'accent',
  'accentHover',
  'accentPressed',
  'accentSoft',
  'accentMuted',
] as const;
const SEMANTIC_TOKENS = [
  'success',
  'successSoft',
  'danger',
  'dangerSoft',
  'warning',
  'warningSoft',
  'info',
  'infoSoft',
] as const;
const BORDER_TOKENS = ['border', 'borderStrong', 'divider'] as const;

type ColorKey = keyof ReturnType<typeof useTheme>['colors'];

export function ColorsStory() {
  const theme = useTheme();

  return (
    <StoryFrame
      title="Colors"
      description="Active palette. Cycle the theme to compare Light vs Dark. Saffron is the locked single accent across both."
    >
      <Section label="Surface">
        <Swatches tokens={SURFACE_TOKENS as readonly ColorKey[]} />
      </Section>
      <Section label="Text">
        <Swatches tokens={TEXT_TOKENS as readonly ColorKey[]} />
      </Section>
      <Section label="Accent (Saffron)">
        <Swatches tokens={ACCENT_TOKENS as readonly ColorKey[]} />
      </Section>
      <Section label="Semantic">
        <Swatches tokens={SEMANTIC_TOKENS as readonly ColorKey[]} />
      </Section>
      <Section label="Borders">
        <Swatches tokens={BORDER_TOKENS as readonly ColorKey[]} />
      </Section>

      <Text
        style={[
          theme.type.caption,
          { color: theme.colors.textTertiary, marginTop: theme.spacing.md },
        ]}
      >
        Source: Nearfold Design System v1.2 → Phase 02 Tokens.
      </Text>
    </StoryFrame>
  );
}

function Swatches({ tokens }: { tokens: readonly ColorKey[] }) {
  const theme = useTheme();
  return (
    <Row gap={theme.spacing.sm} align="flex-start">
      {tokens.map((token) => {
        const value = theme.colors[token] as string;
        return (
          <View key={token} style={styles.swatchWrap}>
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: value,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.md,
                },
              ]}
            />
            <Text
              style={[
                theme.type.labelSm,
                { color: theme.colors.text, marginTop: theme.spacing.xxs },
              ]}
            >
              {token}
            </Text>
            <Text
              style={[
                theme.type.monoSm,
                { color: theme.colors.textTertiary },
              ]}
            >
              {value}
            </Text>
          </View>
        );
      })}
    </Row>
  );
}

const styles = StyleSheet.create({
  swatchWrap: {
    width: 104,
  },
  swatch: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
