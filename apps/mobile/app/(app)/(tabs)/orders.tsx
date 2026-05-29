// Orders tab — the buyer's order history (GET /orders/mine). Each row taps
// through to the live tracking screen. Polling lives on the detail screen;
// this list refetches on focus.

import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../src/theme/useTheme';
import { Card, EmptyState, Price, Skeleton } from '../../../src/components';
import { useMyOrders } from '../../../src/hooks/useOrders';
import { relativeTime } from '../../../src/lib/format';
import { STATUS_ICON, STATUS_LABEL, isTerminal } from '../../../src/lib/orderStatus';
import type { Order } from '../../../src/api/types';

export default function OrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useMyOrders();

  const orders = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xs }}>
        <Text style={[theme.type.h2, { color: theme.colors.text }]}>Orders</Text>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={84} radius={theme.radii.xl} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState emoji="🌧️" title="Couldn’t load orders" actionLabel="Retry" onAction={() => refetch()} />
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(o: Order) => o.id}
          estimatedItemSize={96}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xs, paddingBottom: theme.spacing['4xl'] }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}
          renderItem={({ item }) => {
            const itemCount = item.items.reduce((n, i) => n + i.quantity, 0);
            const live = !isTerminal(item.status);
            return (
              <Card variant="elevated" onPress={() => router.push(`/order/${item.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.icon, { backgroundColor: theme.colors.accentMuted }]}>
                    <Ionicons name={STATUS_ICON[item.status]} size={20} color={theme.colors.accent} />
                  </View>
                  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[theme.type.label, { color: theme.colors.text, flex: 1 }]}>
                        {STATUS_LABEL[item.status]}
                      </Text>
                      {live ? <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} /> : null}
                    </View>
                    <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                      {itemCount} item{itemCount === 1 ? '' : 's'} · {relativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Price paise={item.totalAmount} size="sm" />
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              emoji="🧾"
              title="No orders yet"
              body="When you order from a maker nearby, you’ll track it here — from kitchen to doorstep."
              actionLabel="Browse makers"
              onAction={() => router.replace('/home')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
