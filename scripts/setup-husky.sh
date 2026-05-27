#!/usr/bin/env bash
# Sets up Husky git hooks. Run automatically by the `prepare` npm script.
set -euo pipefail

# husky v9 reads hooks from .husky/ directly. Create the pre-commit hook.
mkdir -p .husky
cat > .husky/pre-commit <<'HOOK'
pnpm exec lint-staged
HOOK
chmod +x .husky/pre-commit

echo "Husky pre-commit hook installed."
