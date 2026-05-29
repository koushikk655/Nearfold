// DevGallery — Storybook-style design system browser.
//
// Layout:
//   - tablet (width >= 720): permanent left sidebar
//   - phone:                  hamburger toggles a slide-in drawer
//
// State: active story id is in React state (not URL). When we want
// deep-linking we'll promote to expo-router search params.

import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/useTheme';
import { useThemeContext } from '../theme/ThemeProvider';
import { durations, easings } from '../motion';
import { Sidebar } from './Sidebar';
import { allStories, findStory } from './stories';

const TABLET_BREAKPOINT = 720;
const SIDEBAR_WIDTH = 240;

export function DevGallery() {
  const theme = useTheme();
  const { mode, cycleMode } = useThemeContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const [activeId, setActiveId] = useState<string>(
    () => allStories[0]?.id ?? 'colors',
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerProgress = useSharedValue(0);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    drawerProgress.value = withTiming(1, {
      duration: durations.short,
      easing: easings.decelerate,
    });
  }, [drawerProgress]);

  const closeDrawer = useCallback(() => {
    drawerProgress.value = withTiming(
      0,
      { duration: durations.short, easing: easings.accelerate },
      (finished) => {
        'worklet';
        if (finished) runOnJS(setDrawerOpen)(false);
      },
    );
  }, [drawerProgress]);

  const story = useMemo(() => findStory(activeId), [activeId]);

  function handleSelect(id: string) {
    setActiveId(id);
    if (!isTablet) closeDrawer();
  }

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: (1 - drawerProgress.value) * -SIDEBAR_WIDTH,
      },
    ],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: drawerProgress.value,
  }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.bg,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {!isTablet ? (
          <Pressable
            onPress={openDrawer}
            accessibilityRole="button"
            accessibilityLabel="Open story navigator"
            hitSlop={8}
            style={[
              styles.iconButton,
              {
                borderColor: theme.colors.borderStrong,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Hamburger color={theme.colors.text} />
          </Pressable>
        ) : null}

        <View style={{ flex: 1, marginLeft: !isTablet ? theme.spacing.sm : 0 }}>
          <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary }]}>
            NEARFOLD · DEV
          </Text>
          <Text style={[theme.type.h4, { color: theme.colors.text }]}>
            {story?.title ?? 'Design system'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Theme: ${mode}. Tap to cycle.`}
          onPress={cycleMode}
          style={[
            styles.themeChip,
            {
              borderColor: theme.colors.borderStrong,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[theme.type.mono, { color: theme.colors.text }]}>
            {mode}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dev gallery"
          hitSlop={8}
          onPress={() => router.replace('/')}
          style={[
            styles.iconButton,
            {
              marginLeft: theme.spacing.xs,
              borderColor: theme.colors.borderStrong,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[theme.type.body, { color: theme.colors.text, lineHeight: 20 }]}>
            ✕
          </Text>
        </Pressable>
      </View>

      {/* Body: split or single column */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {isTablet ? (
          <Sidebar
            activeId={activeId}
            onSelect={handleSelect}
            width={SIDEBAR_WIDTH}
          />
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing['4xl'],
          }}
        >
          {story ? story.render() : <NoStory />}
        </ScrollView>
      </View>

      {/* Phone drawer overlay */}
      {!isTablet && drawerOpen ? (
        <>
          <Animated.View
            pointerEvents={drawerOpen ? 'auto' : 'none'}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: theme.colors.scrim },
              scrimStyle,
            ]}
          >
            <Pressable
              onPress={closeDrawer}
              accessibilityRole="button"
              accessibilityLabel="Close story navigator"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                backgroundColor: theme.colors.surface,
                width: SIDEBAR_WIDTH,
              },
              drawerStyle,
            ]}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left']}>
              <Sidebar
                activeId={activeId}
                onSelect={handleSelect}
                width={SIDEBAR_WIDTH}
              />
            </SafeAreaView>
          </Animated.View>
        </>
      ) : null}
    </SafeAreaView>
  );
}

function NoStory() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: theme.spacing.lg }}>
      <Text style={[theme.type.h3, { color: theme.colors.text }]}>
        Pick a story
      </Text>
      <Text
        style={[
          theme.type.body,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
        ]}
      >
        Open the navigator on the left to start.
      </Text>
    </View>
  );
}

function Hamburger({ color }: { color: string }) {
  return (
    <View style={{ width: 16, gap: 3 }}>
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
});
