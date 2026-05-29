# Fonts

The Nearfold type stack — drop the following `.ttf` files into this directory before the first run. All three families ship under the SIL Open Font License (OFL).

## Required files

**Fraunces** (serif, headings + display) — https://github.com/undercase/fraunces
- `Fraunces-Regular.ttf`
- `Fraunces-Medium.ttf`
- `Fraunces-SemiBold.ttf`
- `Fraunces-Bold.ttf`
- `Fraunces-Italic.ttf`

**Inter** (sans, body + UI) — https://github.com/rsms/inter
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

**JetBrains Mono** (mono, numerics + codes) — https://github.com/JetBrains/JetBrainsMono
- `JetBrainsMono-Regular.ttf`
- `JetBrainsMono-Medium.ttf`
- `JetBrainsMono-Bold.ttf`

## Quick install

From the **`apps/mobile/`** directory:

```bash
mkdir -p assets/fonts && cd assets/fonts

# Inter
curl -L -o Inter-Regular.ttf  "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.ttf"
curl -L -o Inter-Medium.ttf   "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Medium.ttf"
curl -L -o Inter-SemiBold.ttf "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-SemiBold.ttf"
curl -L -o Inter-Bold.ttf     "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.ttf"

# JetBrains Mono
curl -L -o JetBrainsMono-Regular.ttf "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf"
curl -L -o JetBrainsMono-Medium.ttf  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Medium.ttf"
curl -L -o JetBrainsMono-Bold.ttf    "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Bold.ttf"

# Fraunces — fetch from Google Fonts static export, or download from the repo above
```

Once placed, `pnpm --filter mobile start` will pick them up on next reload. The splash screen is held until the fonts finish loading (see `app/_layout.tsx`).
