// Babel configuration. The reanimated plugin MUST be listed last.
//
// In production builds (BABEL_ENV=production), we layer in
// `babel-plugins/replace-dev-imports.js` which rewrites any import of
// `src/dev/*` to point at the production stub. This excludes the entire
// dev gallery tree from production bundles. See babel-plugins/ and
// scripts/verify-prod-strip.sh for details.

const path = require('path');

module.exports = function (api) {
  api.cache.using(() => process.env.BABEL_ENV ?? process.env.NODE_ENV);

  const isProd =
    process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Production-only: replace src/dev/* imports with stub
      ...(isProd ? [path.resolve(__dirname, 'babel-plugins/replace-dev-imports.js')] : []),
      // Reanimated plugin MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
