// Avatar — image with initials fallback and optional status dot.
// Uses expo-image for fast, cached loads with blurhash placeholder support.
// Sizes xs/sm/md/lg/xl follow the spacing scale so they line up with rows
// and list densities without bespoke layout math.

import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '../theme/useTheme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'busy' | 'offline' | 'none';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  blurhash?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

function initialsFor(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = 'md',
  status = 'none',
  blurhash,
  style,
  accessibilityLabel,
}: AvatarProps) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const dim = SIZE_MAP[size];
  const showImage = !!uri && !imageFailed;

  const initialsType = useMemo(() => {
    if (dim <= 24) return { ...theme.type.labelSm, fontSize: 10, lineHeight: 12 };
    if (dim <= 32) return { ...theme.type.labelSm };
    if (dim <= 40) return { ...theme.type.label };
    if (dim <= 56) return { ...theme.type.h4, fontSize: 18, lineHeight: 22 };
    return { ...theme.type.h3 };
  }, [theme, dim]);

  const statusColor = useMemo(() => {
    if (status === 'online') return theme.colors.success;
    if (status === 'busy') return theme.colors.danger;
    if (status === 'offline') return theme.colors.textTertiary;
    return null;
  }, [theme, status]);

  return (
    <View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.colors.accentSoft,
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? name}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          placeholder={blurhash ? { blurhash } : undefined}
          contentFit="cover"
          transition={200}
          onError={() => setImageFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[initialsType, { color: theme.colors.textOnAccent }]}>
            {initialsFor(name)}
          </Text>
        </View>
      )}

      {statusColor ? (
        <View
          style={[
            styles.statusDot,
            {
              width: Math.max(8, Math.round(dim * 0.22)),
              height: Math.max(8, Math.round(dim * 0.22)),
              borderRadius: Math.max(4, Math.round(dim * 0.11)),
              backgroundColor: statusColor,
              borderColor: theme.colors.surface,
              borderWidth: Math.max(1.5, Math.round(dim * 0.04)),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
