// SearchBar — debounced search input for the discovery feed. Controlled
// value with an internal debounce so the parent only re-queries after the
// user pauses typing. A clear button appears when there's text.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

export interface SearchBarProps {
  placeholder?: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
}

export function SearchBar({
  placeholder = 'Search makers, bakes, crafts…',
  onDebouncedChange,
  debounceMs = 350,
}: SearchBarProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onDebouncedChange(value.trim()), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      <Text style={{ fontSize: 16, color: theme.colors.textTertiary, marginRight: 8 }}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        returnKeyType="search"
        style={[styles.input, theme.type.body, { color: theme.colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => setValue('')} hitSlop={8} accessibilityLabel="Clear search">
          <Text style={{ fontSize: 16, color: theme.colors.textTertiary }}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, paddingVertical: 0 },
});
