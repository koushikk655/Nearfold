// CategoryChips — horizontal scroller of selectable category filters for
// the discovery feed. Single-select (tapping the active one clears it).
// Built on the Chip primitive so selection visuals stay consistent.

import { ScrollView } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { Chip } from '../Chip';

// Maker categories for a hyperlocal artisan marketplace — home bakers,
// preserve-makers, crafts, candle/soap makers, etc. NOT a food-delivery
// taxonomy. Keep in sync with the seller category values used in the seed.
export const CATEGORIES = [
  'Bakes',
  'Pickles',
  'Sweets',
  'Crafts',
  'Candles',
  'Ceramics',
  'Plants',
  'Prints',
  'Decor',
  'Gifts',
] as const;

export interface CategoryChipsProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
      }}
    >
      {CATEGORIES.map((c) => (
        <Chip
          key={c}
          label={c}
          selected={selected === c}
          onPress={() => onSelect(selected === c ? null : c)}
        />
      ))}
    </ScrollView>
  );
}
