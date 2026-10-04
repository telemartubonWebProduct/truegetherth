#!/usr/bin/env bash
# Builds the app against the local Supabase stack and runs the Playwright suite,
# including the Admin authentication flows. Start the stack first:
#   npm run db:start
#   npm run test:e2e:local [-- <playwright args>]
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
eval "$(bash scripts/supabase/local-env.sh)"

# The suites change the database directly (and the publish suite clears its
# releases); a data cache kept from an earlier build would still hold them.
rm -rf .next/cache/fetch-cache
npm run build
npx playwright test "$@"
