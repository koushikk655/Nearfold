// Motion — interactive demos for each duration, easing, and spring preset.
// Tapping each row replays the animation so you can feel the difference.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

import { useTheme } from '../../theme/useTheme';
import { durations, springs, type DurationToken, type SpringToken } from '../../motion';
import { Section, StoryFrame } from '../StoryFrame';

const DURATION_TOKENS = Object.keys(durations) as DurationToken[];
const SPRING_TOKENS = Object.keys(springs) as SpringToken[];

export function MotionStory() {
  const theme = useTheme();

  return (
    <StoryFrame
      title="Motion"
      description="Tap a row to replay. Durations land 120–500ms for most micro-interactions; springs add physics where it reads as personality."
    >
      <Section label="Durations · timing">
        {DURATION_TOKENS.map((token) => (
          <DurationRow key={token} token={token} />
        ))}
      </Section>
      <Section label="Springs">
        {SPRING_TOKENS.map((token) => (
          <SpringRow key={token} token={token} />
        ))}
      </Section>
      <Text
        style={[
          theme.type.caption,
          { color: theme.colors.textTertiary, marginTop: theme.spacing.md },
        ]}
      >
        Source: Nearfold Design System v1.2 → Phase 03 Motion Language.
      </Text>
    </StoryFrame>
  );
}

function DurationRow({ token }: { token: DurationToken }) {
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const ms = durations[token];

  return (
    <Pressable
      onPress={() => setTick((t) => t + 1)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
      }}
    >
      <View style={{ width: 110 }}>
        <Text style={[theme.type.label, { color: theme.colors.text }]}>{token}</Text>
        <Text style={[theme.type.monoSm, { color: theme.colors.textTertiary }]}>
          {ms}ms
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          height: 28,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.sm,
          overflow: 'hidden',
        }}
      >
        <MotiView
          key={tick}
          from={{ translateX: -120 }}
          animate={{ translateX: 999 }}
          transition={{
            type: 'timing',
            duration: Math.max(ms, 1),
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }}
          style={{
            width: 120,
            height: '100%',
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radii.sm,
          }}
        />
      </View>
    </Pressable>
  );
}

function SpringRow({ token }: { token: SpringToken }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const cfg = springs[token];

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
      }}
    >
      <View style={{ width: 110 }}>
        <Text style={[theme.type.label, { color: theme.colors.text }]}>{token}</Text>
        <Text style={[theme.type.monoSm, { color: theme.colors.textTertiary }]}>
          d{cfg.damping} · s{cfg.stiffness}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          height: 32,
          justifyContent: 'center',
        }}
      >
        <MotiView
          animate={{ translateX: open ? 220 : 0 }}
          transition={{ type: 'spring', ...cfg }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.accent,
          }}
        />
      </View>
    </Pressable>
  );
}
