// Sidebar — categorized tree of stories. Used in both the permanent
// tablet layout and the drawer overlay on phones.

import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { storyGroups } from './stories';

export interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  width?: number;
}

export function Sidebar({ activeId, onSelect, width = 240 }: SidebarProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        width,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
      }}
    >
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg }}>
        {storyGroups.map((group) => (
          <View key={group.id} style={{ marginBottom: theme.spacing.lg }}>
            <Text
              style={[
                theme.type.labelSm,
                {
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  paddingHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.xs,
                },
              ]}
            >
              {group.title}
            </Text>
            {group.stories.map((story) => {
              const active = story.id === activeId;
              return (
                <Pressable
                  key={story.id}
                  onPress={() => onSelect(story.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingVertical: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 3,
                      height: 18,
                      backgroundColor: active ? theme.colors.accent : 'transparent',
                      borderRadius: 2,
                      marginRight: theme.spacing.sm,
                    }}
                  />
                  <Text
                    style={[
                      theme.type.body,
                      {
                        color: active ? theme.colors.text : theme.colors.textSecondary,
                        fontFamily: active
                          ? theme.fontFamilies.sans.semibold
                          : theme.fontFamilies.sans.regular,
                      },
                    ]}
                  >
                    {story.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
