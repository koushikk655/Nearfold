// EmptyState — the friendly "nothing here" / "something broke" panel.
// Editorial, warm copy (not "ERROR 404") per the brand voice. Optional
// action button.

import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { Button } from './Button';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  emoji,
  title,
  body,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.spacing['4xl'],
          paddingHorizontal: theme.spacing.xl,
        },
        style,
      ]}
    >
      {emoji ? (
        <Text style={{ fontSize: 44, marginBottom: theme.spacing.md }}>{emoji}</Text>
      ) : null}
      <Text
        style={[
          theme.type.h3,
          { color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.xs },
        ]}
      >
        {title}
      </Text>
      {body ? (
        <Text
          style={[
            theme.type.body,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              maxWidth: 300,
            },
          ]}
        >
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
