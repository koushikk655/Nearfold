// Chip story — selectable, removable, with icon, sm + md.

import { useState } from 'react';
import { Text } from 'react-native';

import { Chip } from '../../components';
import { useTheme } from '../../theme/useTheme';
import { Row, Section, StoryFrame } from '../StoryFrame';

const CATEGORIES = ['Tiffin', 'Snacks', 'Pickle', 'Bakery', 'Sweets', 'Handmade'];

export function ChipStory() {
  const theme = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set(['Tiffin']));
  const [filters, setFilters] = useState(['Vegetarian', 'Under ₹200', 'Open now']);

  function toggle(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <StoryFrame
      title="Chip"
      description="Selectable for filter / category picking, removable for applied-filter rows."
    >
      <Section label="Selectable · multi (md)">
        <Row gap={theme.spacing.xs}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={selected.has(c)}
              onPress={() => toggle(c)}
            />
          ))}
        </Row>
        <Text
          style={[
            theme.type.monoSm,
            { color: theme.colors.textTertiary, marginTop: theme.spacing.xs },
          ]}
        >
          selected: [{[...selected].join(', ') || '—'}]
        </Text>
      </Section>

      <Section label="Removable · sm">
        <Row gap={theme.spacing.xs}>
          {filters.map((f) => (
            <Chip
              key={f}
              label={f}
              size="sm"
              selected
              onRemove={() => setFilters((cur) => cur.filter((x) => x !== f))}
            />
          ))}
          {filters.length === 0 ? (
            <Text style={[theme.type.bodySm, { color: theme.colors.textTertiary }]}>
              All cleared. Reselect categories above to repopulate.
            </Text>
          ) : null}
        </Row>
      </Section>

      <Section label="Disabled">
        <Row gap={theme.spacing.xs}>
          <Chip label="Sold out" disabled />
          <Chip label="Coming soon" disabled selected />
        </Row>
      </Section>
    </StoryFrame>
  );
}
