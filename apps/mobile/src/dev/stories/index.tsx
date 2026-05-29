// Story registry — single source of truth for the dev gallery. To add a
// new story: create a *.tsx in this directory and register it in the
// `storyGroups` array below.

import type { ReactNode } from 'react';

import { AvatarStory } from './AvatarStory';
import { ButtonStory } from './ButtonStory';
import { CardStory } from './CardStory';
import { ChipStory } from './ChipStory';
import { ColorsStory } from './ColorsStory';
import { MotionStory } from './MotionStory';
import { SpacingStory } from './SpacingStory';
import { TextInputStory } from './TextInputStory';
import { TypographyStory } from './TypographyStory';

export interface Story {
  id: string;
  title: string;
  render: () => ReactNode;
}

export interface StoryGroup {
  id: string;
  title: string;
  stories: Story[];
}

export const storyGroups: StoryGroup[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    stories: [
      { id: 'colors', title: 'Colors', render: () => <ColorsStory /> },
      { id: 'typography', title: 'Typography', render: () => <TypographyStory /> },
      { id: 'spacing', title: 'Spacing & Radii', render: () => <SpacingStory /> },
      { id: 'motion', title: 'Motion', render: () => <MotionStory /> },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    stories: [
      { id: 'button', title: 'Button', render: () => <ButtonStory /> },
      { id: 'text-input', title: 'TextInput', render: () => <TextInputStory /> },
      { id: 'card', title: 'Card', render: () => <CardStory /> },
      { id: 'chip', title: 'Chip', render: () => <ChipStory /> },
      { id: 'avatar', title: 'Avatar', render: () => <AvatarStory /> },
    ],
  },
];

export const allStories: Story[] = storyGroups.flatMap((g) => g.stories);

export function findStory(id: string): Story | undefined {
  return allStories.find((s) => s.id === id);
}
