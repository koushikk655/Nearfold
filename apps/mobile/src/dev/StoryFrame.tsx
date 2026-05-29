// Story frame + Row helpers — keep individual stories visually consistent
// without each one redefining its own header/section layout.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';

export function StoryFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xl }}>
      <View>
        <Text
          style={[
            theme.type.labelSm,
            {
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              marginBottom: theme.spacing.xxs,
              letterSpacing: 1.2,
            },
          ]}
        >
          Story
        </Text>
        <Text style={[theme.type.h2, { color: theme.colors.text }]}>{title}</Text>
        {description ? (
          <Text
            style={[
              theme.type.bodyLg,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Section({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={style}>
      <Text
        style={[
          theme.type.labelSm,
          {
            color: theme.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export function Row({
  children,
  gap,
  wrap = true,
  align = 'center',
}: {
  children: ReactNode;
  gap?: number;
  wrap?: boolean;
  align?: ViewStyle['alignItems'];
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          gap: gap ?? theme.spacing.sm,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          alignItems: align,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
