// Order tracking — live status timeline (polls every 30s until terminal),
// payment state, itemized summary, delivery address, and cancel (while the
// order is still pending/confirmed).

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../src/theme/useTheme';
import { Button, Card, EmptyState, Price, Skeleton } from '../../../src/components';
import { useOrder, useCancelOrder } from '../../../src/hooks/useOrders';
import { relativeTime } from '../../../src/lib/format';
import {
  PAYMENT_LABEL,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_STEPS,
  STATUS_SUBTITLE,
  isCancellable,
  statusStepIndex,
} from '../../../src/lib/orderStatus';

export default function OrderTrackingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id);

  const { data: order, isLoading, isError } = useOrder(orderId);
  const cancel = useCancelOrder(orderId);

  const onCancel = () => {
    Alert.prompt?.(
      'Cancel order?',
      'Tell the maker why (optional).',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: (reason?: string) => cancel.mutate(reason?.trim() || 'Changed my mind'),
        },
      ],
      'plain-text',
    );
    // Android has no Alert.prompt — fall back to a plain confirm.
    if (!Alert.prompt) {
      Alert.alert('Cancel order?', 'This can’t be undone.', [
        { text: 'Keep order', style: 'cancel' },
        { text: 'Cancel order', style: 'destructive', onPress: () => cancel.mutate('Changed my mind') },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[theme.type.h3, { color: theme.colors.text, flex: 1 }]}>
          Order {order ? `#${order.id.slice(0, 6).toUpperCase()}` : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: theme.spacing.lg, gap: 16 }}>
          <Skeleton height={90} radius={theme.radii.xl} />
          <Skeleton height={200} radius={theme.radii.xl} />
        </View>
      ) : isError || !order ? (
        <EmptyState emoji="🧾" title="Order not found" body="We couldn’t load this order." actionLabel="Back" onAction={() => router.back()} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing['4xl'] }}>
          {/* Status hero */}
          <Card variant="elevated" style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.heroIcon,
                  { backgroundColor: order.status === 'cancelled' ? theme.colors.dangerSoft : theme.colors.accentMuted },
                ]}
              >
                <Ionicons
                  name={STATUS_ICON[order.status]}
                  size={26}
                  color={order.status === 'cancelled' ? theme.colors.danger : theme.colors.accent}
                />
              </View>
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Text style={[theme.type.h4, { color: theme.colors.text }]}>{STATUS_LABEL[order.status]}</Text>
                <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary }]}>
                  {STATUS_SUBTITLE[order.status]}
                </Text>
              </View>
            </View>
          </Card>

          {/* Timeline (hidden when cancelled) */}
          {order.status !== 'cancelled' ? (
            <View style={{ marginTop: theme.spacing.xl }}>
              {STATUS_STEPS.map((step, i) => {
                const current = statusStepIndex(order.status);
                const done = i < current;
                const active = i === current;
                const log = order.statusLogs?.find((l) => l.newStatus === step);
                return (
                  <View key={step} style={{ flexDirection: 'row' }}>
                    {/* Rail */}
                    <View style={{ alignItems: 'center', width: 28 }}>
                      <View
                        style={[
                          styles.node,
                          {
                            backgroundColor: done || active ? theme.colors.accent : theme.colors.surfaceMuted,
                            borderColor: active ? theme.colors.accent : 'transparent',
                          },
                        ]}
                      >
                        {done ? <Ionicons name="checkmark" size={12} color={theme.colors.textOnAccent} /> : null}
                      </View>
                      {i < STATUS_STEPS.length - 1 ? (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 28,
                            backgroundColor: done ? theme.colors.accent : theme.colors.divider,
                          }}
                        />
                      ) : null}
                    </View>
                    {/* Label */}
                    <View style={{ flex: 1, paddingBottom: theme.spacing.lg, paddingLeft: theme.spacing.sm }}>
                      <Text
                        style={[
                          theme.type.label,
                          { color: done || active ? theme.colors.text : theme.colors.textTertiary },
                        ]}
                      >
                        {STATUS_LABEL[step]}
                      </Text>
                      {log ? (
                        <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                          {relativeTime(log.createdAt)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Card variant="outlined" style={{ marginTop: theme.spacing.lg }}>
              <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
                {order.cancellationReason ?? 'This order was cancelled.'}
              </Text>
            </Card>
          )}

          {/* Payment */}
          <View style={[styles.payRow, { borderColor: theme.colors.border, marginTop: theme.spacing.md }]}>
            <Ionicons name="wallet-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary, flex: 1, marginLeft: 8 }]}>
              {PAYMENT_LABEL[order.paymentStatus]}
            </Text>
            <Price paise={order.totalAmount} size="sm" />
          </View>

          {/* Items */}
          <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
            ITEMS
          </Text>
          <Card variant="outlined" padding="md">
            {order.items.map((it, idx) => (
              <View
                key={it.productId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.divider,
                }}
              >
                <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                  {it.quantity}× {it.name}
                </Text>
                <Price paise={it.unitPrice * it.quantity} size="sm" color={theme.colors.textSecondary} />
              </View>
            ))}
          </Card>

          {/* Address */}
          <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
            DELIVERING TO
          </Text>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{order.deliveryAddress}</Text>

          {order.specialInstructions ? (
            <>
              <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.lg, marginBottom: 4 }]}>
                NOTE
              </Text>
              <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary }]}>{order.specialInstructions}</Text>
            </>
          ) : null}

          <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginTop: theme.spacing.lg }]}>
            Placed {relativeTime(order.createdAt)}
          </Text>

          {/* Cancel */}
          {isCancellable(order.status) ? (
            <View style={{ marginTop: theme.spacing.xl }}>
              <Button
                label="Cancel order"
                variant="destructive"
                onPress={onCancel}
                loading={cancel.isPending}
                fullWidth
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  node: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  payRow: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
});
