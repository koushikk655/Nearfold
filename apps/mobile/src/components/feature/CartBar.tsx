// CartBar — a floating "N items · ₹total · View cart" bar that slides up
// from the bottom whenever the cart is non-empty. Mounted on the shop and
// product screens so the buyer can always jump to checkout. Driven by the
// cart query so it stays in sync everywhere.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatePresence, MotiView } from 'moti';

import { useTheme } from '../../theme/useTheme';
import { Price } from '../Price';
import { useCart, useCartCount } from '../../hooks/useCart';

export function CartBar() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useCart();
  const count = useCartCount();

  const total = data?.totals.totalAmount ?? 0;
  const visible = count > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <MotiView
          from={{ translateY: 80, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          style={[
            styles.wrap,
            { bottom: insets.bottom + 12, left: theme.spacing.lg, right: theme.spacing.lg },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View cart, ${count} items, total ${total / 100} rupees`}
            onPress={() => router.push('/cart')}
            style={[styles.bar, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill }]}
          >
            <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
              <Text style={[theme.type.label, { color: theme.colors.textOnAccent }]}>{count}</Text>
            </View>
            <Text style={[theme.type.button, { color: theme.colors.textOnAccent, flex: 1 }]}>
              View cart
            </Text>
            <Price paise={total} size="md" color={theme.colors.textOnAccent} />
          </Pressable>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#2A2018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
