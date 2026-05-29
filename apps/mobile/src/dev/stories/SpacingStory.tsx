// Spacing & radii — visual rulers for every step. Quick sanity check that
// the 4pt grid is intact and the radii ramp doesn't have visual gaps.

import { Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import type { RadiusToken, SpacingToken } from '../../theme';
import { Section, StoryFrame } from '../StoryFrame';

export function SpacingStory() {
  const theme = useTheme();
  const spacingKeys = Object.keys(theme.spacing) as SpacingToken[];
  const radiiKeys = Object.keys(theme.radii) as RadiusToken[];

  return (
    <StoryFrame
      title="Spacing & Radii"
      description="4pt base grid for spacing. Radii ramp from sharp (none) to full pill."
    >
      <Section label="Spacing">
        {spacingKeys.map((key) => (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.xs,
            }}
          >
            <Text
              style={[
                theme.type.monoSm,
                { color: theme.colors.textTertiary, width: 70 },
              ]}
            >
              {key}
            </Text>
            <Text
              style={[
                theme.type.monoSm,
                { color: theme.colors.text, width: 50 },
              ]}
            >
              {theme.spacing[key]}
            </Text>
            <View
              style={{
                height: 12,
                width: Math.max(theme.spacing[key], 1),
                backgroundColor: theme.colors.accent,
                borderRadius: 2,
              }}
            />
          </View>
        ))}
      </Section>

      <Section label="Radii">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          {radiiKeys.map((key) => (
            <View key={key} style={{ alignItems: 'center', width: 100 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: Math.min(theme.radii[key], 32),
                  borderColor: theme.colors.accent,
                  borderWidth: 1,
                }}
              />
              <Text
                style={[
                  theme.type.labelSm,
                  { color: theme.colors.text, marginTop: theme.spacing.xxs },
                ]}
              >
                {key}
              </Text>
              <Text
                style={[
                  theme.type.monoSm,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {theme.radii[key]}
              </Text>
            </View>
          ))}
        </View>
      </Section>
    </StoryFrame>
  );
}
