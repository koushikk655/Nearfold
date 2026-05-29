// Production stub for everything under `src/dev/*`.
//
// The babel plugin at babel-plugins/replace-dev-imports.js rewrites any
// `import … from '…/src/dev/…'` to point at THIS file when
// BABEL_ENV=production. Metro therefore never traverses into src/dev/,
// and the entire dev-gallery tree is excluded from the bundle.
//
// We expose a Proxy so any named or default import (DevGallery, Sidebar,
// ColorsStory, StoryFrame, storyGroups, …) resolves to the same no-op
// component. No need to enumerate every export across 11 modules.
//
// The no-op component redirects the user back home; in normal use this
// is unreachable (the /dev/_layout.tsx already redirects when !__DEV__),
// but if anything in the codebase mistakenly renders a stubbed export,
// the failure mode is "you land on /" rather than a white screen.

import { Redirect } from 'expo-router';
import type { ReactElement } from 'react';

function DevDisabled(): ReactElement {
  return <Redirect href="/" />;
}

// Proxy a CommonJS module object. The default key is set explicitly so
// `_interopRequireDefault(stub).default` resolves correctly without
// triggering the catch-all.
const stub = new Proxy(
  { default: DevDisabled, __esModule: true } as Record<string | symbol, unknown>,
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Symbols (e.g. Symbol.toPrimitive) — return undefined to avoid
      // confusing things like console.log(stub).
      if (typeof prop === 'symbol') return undefined;
      return DevDisabled;
    },
  },
);

// CommonJS export so Babel's CJS↔ESM interop sees both the `default` and
// arbitrary named exports through the Proxy.
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = stub;
