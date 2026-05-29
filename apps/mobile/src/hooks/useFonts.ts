// useFonts — load the Nearfold type stack (Fraunces + Inter + JetBrains Mono).
// Wrapped around expo-font's `useFonts` so the rest of the app can stay
// font-source agnostic.
//
// Fonts MUST be present at apps/mobile/assets/fonts/ — they ship with the
// repo (open source: Fraunces, Inter, JetBrains Mono — SIL OFL).

import { useFonts as useExpoFonts } from 'expo-font';

export function useFonts() {
  const [loaded, error] = useExpoFonts({
    // Fraunces — serif headings (variable supports 100-900 + opsz; we ship statics)
    'Fraunces-Regular': require('../../assets/fonts/Fraunces-Regular.ttf'),
    'Fraunces-Medium': require('../../assets/fonts/Fraunces-Medium.ttf'),
    'Fraunces-SemiBold': require('../../assets/fonts/Fraunces-SemiBold.ttf'),
    'Fraunces-Bold': require('../../assets/fonts/Fraunces-Bold.ttf'),
    'Fraunces-Italic': require('../../assets/fonts/Fraunces-Italic.ttf'),

    // Inter — sans body / UI
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),

    // JetBrains Mono — numbers, codes, metadata
    'JetBrainsMono-Regular': require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Medium': require('../../assets/fonts/JetBrainsMono-Medium.ttf'),
    'JetBrainsMono-Bold': require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  return { loaded, error };
}
