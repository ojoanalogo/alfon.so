#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for alfon.so.
set -euo pipefail

NODE_VERSION="$(tr -d ' \t\n\r' < "$(dirname "$0")/../.nvmrc")"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION" >/dev/null
nvm alias default "$NODE_VERSION" >/dev/null

# The Cloud Agent runtime injects /exec-daemon/node (an older Node) ahead of nvm
# on PATH, which would otherwise shadow the version this repo pins in .nvmrc.
# /usr/local/cargo/bin precedes /exec-daemon on PATH, so linking the pinned
# toolchain there makes it the effective `node` for every shell and terminal.
NODE_BIN="$NVM_DIR/versions/node/v$NODE_VERSION/bin"
for tool in node npm npx corepack; do
  ln -sf "$NODE_BIN/$tool" "/usr/local/cargo/bin/$tool"
done

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install --with-deps chromium
