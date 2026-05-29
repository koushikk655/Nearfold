// Card story — elevated / outlined / flat, with and without onPress.

import { Text, View } from 'react-native';

import { Card } from '../../components';
import { useTheme } from '../../theme/useTheme';
import { Section, StoryFrame } from '../StoryFrame';

export function CardStory() {
  const theme = useTheme();

  return (
    <StoryFrame
      title="Card"
      description="The workhorse container. Use elevated for foreground rows, outlined when shadows are too loud (e.g. on a busy hero), flat for asides and metadata."
    >
      <Section label="Elevated (default)">
        <Card variant="elevated">
          <Text style={[theme.type.h4, { color: theme.colors.text, marginBottom: 4 }]}>
            Aunty’s evening tiffin
          </Text>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
            Roti, sabzi, dal, rice. Hot at 7pm. Five blocks away.
          </Text>
        </Card>
      </Section>

      <Section label="Outlined · pressable">
        <Card variant="outlined" onPress={() => {}}>
          <Text style={[theme.type.h4, { color: theme.colors.text, marginBottom: 4 }]}>
            Tap me
          </Text>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
            Selection haptic + subtle scale animation on press.
          </Text>
        </Card>
      </Section>

      <Section label="Flat · sm padding">
        <Card variant="flat" padding="sm">
          <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary }]}>
            Flat card — no shadow, muted surface. Use for footnotes, metadata, dev notes.
          </Text>
        </Card>
      </Section>

      <Section label="Padding scale">
        <View style={{ gap: theme.spacing.sm }}>
          {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
            <Card key={p} variant="outlined" padding={p}>
              <Text style={[theme.type.label, { color: theme.colors.text }]}>
                padding="{p}"
              </Text>
            </Card>
          ))}
        </View>
      </Section>
    </StoryFrame>
  );
}
