// babel-plugins/replace-dev-imports.js
//
// In production builds (BABEL_ENV=production), rewrite any import or
// require() pointing into `src/dev/` so it resolves to `src/dev-stub.tsx`
// instead. The original dev modules are never visited by Metro's dep
// graph and therefore never end up in the bundle.
//
// This plugin is only registered in production mode by babel.config.js;
// in dev builds it is a no-op (the file isn't even loaded).
//
// Verification: run `pnpm --filter mobile verify:prod-strip` after any
// change to this file. The script grep's the production bundle for
// unique strings from each dev module and fails if any are found.

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STUB_ABS_PATH = path.resolve(PROJECT_ROOT, 'src/dev-stub.tsx');

// Match anything that resolves into the dev tree. We support three forms:
//   1. relative paths that climb out into src/dev/  (../../src/dev/Foo)
//   2. absolute paths into src/dev/ (rare, but harmless)
//   3. raw substrings 'src/dev/' (defensive; some custom tooling
//      sometimes generates these via path aliases)
const DEV_PATH_RE = /[\\/]src[\\/]dev[\\/]/;

module.exports = function replaceDevImportsPlugin() {
  return {
    name: 'replace-dev-imports',
    visitor: {
      ImportDeclaration(astPath, state) {
        rewrite(astPath.node.source, state);
      },
      CallExpression(astPath, state) {
        const callee = astPath.node.callee;
        const args = astPath.node.arguments;
        if (
          callee &&
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          args.length === 1 &&
          args[0] &&
          args[0].type === 'StringLiteral'
        ) {
          rewrite(args[0], state);
        }
      },
    },
  };
};

function rewrite(sourceNode, state) {
  const sourceValue = sourceNode.value;
  if (typeof sourceValue !== 'string') return;

  const currentFile = state.filename;
  if (!currentFile) return;

  const currentDir = path.dirname(currentFile);

  // Resolve relative imports to determine if they land in src/dev/.
  // For non-relative (bare) imports, we only act if the literal contains
  // '/src/dev/' — we don't want to touch dependencies in node_modules.
  let resolvedTarget;
  if (sourceValue.startsWith('.')) {
    resolvedTarget = path.resolve(currentDir, sourceValue);
  } else if (path.isAbsolute(sourceValue)) {
    resolvedTarget = sourceValue;
  } else if (sourceValue.includes('src/dev/')) {
    // bare specifier like 'apps/mobile/src/dev/...' — unusual, but cover it
    resolvedTarget = sourceValue;
  } else {
    return;
  }

  // Use the path WITH a trailing separator added so we never match
  // something like '…/src/development/…' by mistake.
  const probe = resolvedTarget + path.sep;
  if (!DEV_PATH_RE.test(probe)) return;

  // Never rewrite imports made BY the stub itself (it imports from
  // expo-router) or by the babel plugin (this file).
  if (currentFile === STUB_ABS_PATH) return;

  // Compute the relative path from this file to the stub.
  let rel = path.relative(currentDir, STUB_ABS_PATH).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  // Strip the extension; Metro will resolve it via sourceExts.
  rel = rel.replace(/\.(ts|tsx|js|jsx)$/, '');

  sourceNode.value = rel;
}
