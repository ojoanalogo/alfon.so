#!/usr/bin/env bash
# Astro dev server. Held in the foreground so the boot log shows if it exits.
set -euo pipefail
cd "$(dirname "$0")/.."
exec corepack pnpm dev --host 0.0.0.0 --port 4321
