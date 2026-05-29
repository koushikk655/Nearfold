// Discover — the home feed. Location-first: we need the buyer's coords to
// query nearby sellers. If we don't have them (permission denied / not yet
// granted), we show a location gate instead of an empty feed.
//
// Search is client-side: the discovery endpoint has no text-query param,
// so we filter the returned sellers by shop name / category. Category
// chips DO drive the server query (the endpoint takes `category`).
//
// Entry animation: each card fades+rises with a staggered delay
// (FadeInDown) per Phase 03 motion + Phase 04 perceived-performance.

import { useMemo, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../src/theme/useTheme';
import {
  CategoryChips,
  EmptyState,
  SearchBar,
  SellerCard,
  Skeleton,
} from '../../../src/components';
import { discoveryApi } from '../../../src/api/discovery';
import { queryKeys } from '../../../src/lib/queryKeys';
import { useLocationStore } from '../../../src/store/locationStore';
import { useLocation } from '../../../src/hooks/useLocation';
import type { NearbySeller } from '../../../src/api/types';

export default function DiscoverScreen() {
  const theme = useTheme();
  const router = useRouter();

  const coords = useLocationStore((s) => s.coords);
  const city = useLocationStore((s) => s.city);
  const permission = useLocationStore((s) => s.permission);
  const { resolving, error: locError, refresh: refreshLocation } = useLocation(true);

  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const enabled = !!coords;
  const query = useQuery({
    queryKey: coords
      ? queryKeys.discovery({ lat: coords.lat, lng: coords.lng, category: category ?? undefined })
      : ['discovery', 'nodata'],
    queryFn: () =>
      discoveryApi.nearbySellers({
        lat: coords!.lat,
        lng: coords!.lng,
        category: category ?? undefined,
        limit: 50,
      }),
    enabled,
  });

  const sellers = useMemo(() => {
    const list = query.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        s.shopName.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false),
    );
  }, [query.data, search]);

  // ── Location gate ────────────────────────────────────────────────
  if (!coords) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
        <EmptyState
          emoji="📍"
          title="Where are you?"
          body={
            permission === 'denied'
              ? 'We need your location to show makers within delivery range. Enable it in Settings, or try again.'
              : 'Nearfold shows what’s cooking within 5 km of you. Share your location to start.'
          }
          actionLabel={resolving ? 'Locating…' : 'Use my location'}
          onAction={refreshLocation}
        />
        {locError ? (
          <Text
            style={[
              theme.type.caption,
              { color: theme.colors.danger, textAlign: 'center', paddingHorizontal: 24 },
            ]}
          >
            {locError}
          </Text>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text style={[theme.type.caption, { color: theme.colors.textTertiary, letterSpacing: 1.2 }]}>
          {city ? `NEARFOLD · ${city.toUpperCase()}` : 'NEARFOLD'}
        </Text>
        <Text style={[theme.type.h2, { color: theme.colors.text, marginTop: 2 }]}>
          Makers near you.
        </Text>
        <View style={{ marginTop: theme.spacing.md }}>
          <SearchBar onDebouncedChange={setSearch} />
        </View>
      </View>

      <CategoryChips selected={category} onSelect={setCategory} />

      {/* Feed */}
      {query.isLoading ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={100} radius={theme.radii.xl} />
          ))}
        </View>
      ) : query.isError ? (
        <EmptyState
          emoji="🌧️"
          title="Couldn’t load makers"
          body="Something hiccuped between here and the kitchen. Pull to retry."
          actionLabel="Retry"
          onAction={() => query.refetch()}
        />
      ) : (
        <FlashList
          data={sellers}
          keyExtractor={(s: NearbySeller) => s.id}
          estimatedItemSize={108}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing['4xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                void refreshLocation();
                void query.refetch();
              }}
              tintColor={theme.colors.accent}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify().damping(18)}>
              <SellerCard seller={item} onPress={() => router.push(`/shop/${item.id}`)} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🧺"
              title={search ? 'No matches' : 'Quiet around here'}
              body={
                search
                  ? `Nothing matches “${search}” nearby. Try a different search.`
                  : 'No makers in delivery range yet. We’re onboarding sellers city by city — check back soon.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
