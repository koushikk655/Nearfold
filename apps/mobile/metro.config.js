// metro.config.js — pnpm workspace compatible.
//
// pnpm hoists deps into a virtual store under the monorepo root, with
// symlinks at apps/mobile/node_modules/*. Metro needs (a) symlink support
// and (b) explicit watchFolders + nodeModulesPaths covering both the
// app and the workspace root so it can resolve transitive deps.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
