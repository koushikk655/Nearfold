// Avatar story — sizes, statuses, image vs initials.

import { Text } from 'react-native';

import { Avatar } from '../../components';
import { useTheme } from '../../theme/useTheme';
import { Row, Section, StoryFrame } from '../StoryFrame';

// Free portrait stand-ins from Unsplash for the image variant. Replace with
// real CDN URLs once Cloudinary is wired in Week 3+.
const SAMPLES = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
];

export function AvatarStory() {
  const theme = useTheme();

  return (
    <StoryFrame
      title="Avatar"
      description="expo-image under the hood for fast cached loads. Falls back to initials when the URL fails; status dot scales with size."
    >
      <Section label="Sizes · initials fallback">
        <Row align="center">
          <Avatar size="xs" name="Sneha Rao" />
          <Avatar size="sm" name="Priya M" />
          <Avatar size="md" name="Aman K" />
          <Avatar size="lg" name="Lakshmi Devi" />
          <Avatar size="xl" name="Raj P" />
        </Row>
      </Section>

      <Section label="With status dot">
        <Row align="center">
          <Avatar size="md" name="Online seller" status="online" />
          <Avatar size="md" name="Busy" status="busy" />
          <Avatar size="md" name="Offline" status="offline" />
          <Avatar size="lg" name="Lakshmi" status="online" />
          <Avatar size="xl" name="Aman" status="busy" />
        </Row>
      </Section>

      <Section label="With image">
        <Row align="center">
          <Avatar size="md" uri={SAMPLES[0]} name="Maker A" status="online" />
          <Avatar size="lg" uri={SAMPLES[1]} name="Maker B" />
          <Avatar size="xl" uri={SAMPLES[2]} name="Maker C" status="online" />
        </Row>
      </Section>

      <Section label="Fallback on bad URL">
        <Row align="center">
          <Avatar size="lg" uri="https://invalid.example.com/x.jpg" name="Sneha Rao" />
          <Text style={[theme.type.bodySm, { color: theme.colors.textTertiary, flex: 1 }]}>
            Image load failure surfaces initials. Try again with a real URL.
          </Text>
        </Row>
      </Section>
    </StoryFrame>
  );
}
