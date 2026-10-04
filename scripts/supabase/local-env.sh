#!/usr/bin/env bash
# Prints export statements for the running *local* Supabase stack, for builds
# and end-to-end tests:  eval "$(bash scripts/supabase/local-env.sh)"
# The local stack uses per-machine demo keys; nothing here points at a hosted
# project, and it refuses to run if the API URL is not on localhost.
set -euo pipefail

status="$(npx --no-install supabase status -o env)"

value() {
  printf '%s\n' "$status" | sed -n -E "s/^$1=\"?([^\"]*)\"?$/\1/p"
}

api_url="$(value API_URL)"
case "$api_url" in
  http://127.0.0.1:* | http://localhost:*) ;;
  *)
    echo "Refusing: supabase status reported API_URL='${api_url}', expected a local stack." >&2
    exit 1
    ;;
esac

printf 'export NEXT_PUBLIC_SUPABASE_URL=%q\n' "$api_url"
printf 'export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%q\n' "$(value PUBLISHABLE_KEY)"
printf 'export E2E_SUPABASE_SECRET_KEY=%q\n' "$(value SECRET_KEY)"
# The app's own server key (M5 stores call-back requests with it): the local stack's demo key.
printf 'export SUPABASE_SECRET_KEY=%q\n' "$(value SECRET_KEY)"
printf 'export E2E_MAILPIT_URL=%q\n' "$(value MAILPIT_URL)"
