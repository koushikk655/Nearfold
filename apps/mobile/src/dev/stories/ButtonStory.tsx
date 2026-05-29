// Button story — every variant × size, plus loading and disabled states.

import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '../../components';
import { useTheme } from '../../theme/useTheme';
import { Row, Section, StoryFrame } from '../StoryFrame';

export function ButtonStory() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  return (
    <StoryFrame
      title="Button"
      description="Pill-shaped, token-driven. Light haptic on press by default (opt out via haptic={false})."
    >
      <Section label="Variants">
        <Row>
          <Button label="Primary" variant="primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Destructive" variant="destructive" onPress={() => {}} />
        </Row>
      </Section>

      <Section label="Sizes">
        <Row align="center">
          <Button label="Small" size="sm" onPress={() => {}} />
          <Button label="Medium" size="md" onPress={() => {}} />
          <Button label="Large" size="lg" onPress={() => {}} />
        </Row>
      </Section>

      <Section label="States">
        <Row>
          <Button
            label={busy ? 'Saving…' : 'Trigger loading'}
            loading={busy}
            onPress={() => {
              setBusy(true);
              setTimeout(() => setBusy(false), 1500);
            }}
          />
          <Button label="Disabled" disabled onPress={() => {}} />
        </Row>
      </Section>

      <Section label="Layout">
        <Button label="Full width" fullWidth onPress={() => {}} />
      </Section>

      <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>
        On Android the scale animation gives tactile feedback Pressable lacks by default.
      </Text>
    </StoryFrame>
  );
}
