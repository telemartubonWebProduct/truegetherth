#!/usr/bin/env bash
# Claude Cloud helper: prepare Docker so `npm run db:start` / `npm run db:test`
# work under the session's network policy (checked 2026-09-29: Docker Hub
# rate-limits anonymous pulls and the public.ecr.aws / ghcr.io blob hosts are
# blocked, while the mirror.gcr.io Docker Hub mirror is reachable).
#
# It starts dockerd when it is not running, then pulls each image the pinned
# Supabase CLI needs through mirror.gcr.io and tags it with the names the CLI
# looks up. Images already present are skipped. Not needed on GitHub Actions
# or a normal developer machine.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if ! docker info >/dev/null 2>&1; then
  echo 'Starting dockerd...'
  nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
  docker info >/dev/null 2>&1 || { echo 'dockerd did not start; see /tmp/dockerd.log' >&2; exit 1; }
fi

# Versions of the Supabase images come from the CLI itself; the gateway,
# mail catcher and pg_prove versions match Supabase CLI 2.118.0.
mapfile -t service_images < <(
  npx --no-install supabase services --output-format json | node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => (raw += chunk)).on("end", () => {
      const wanted = new Set(["supabase/postgres", "supabase/gotrue", "postgrest/postgrest", "supabase/realtime", "supabase/storage-api"]);
      for (const service of JSON.parse(raw).services) {
        if (wanted.has(service.name)) console.log(`${service.name}:${service.local}`);
      }
    });'
)
images=("${service_images[@]}" 'library/kong:2.8.1' 'axllent/mailpit:v1.30.2' 'supabase/pg_prove:3.36')

for image in "${images[@]}"; do
  local_name="${image#library/}"
  if docker image inspect "$local_name" >/dev/null 2>&1; then
    echo "present: ${local_name}"
    continue
  fi
  echo "pulling: ${image} via mirror.gcr.io"
  docker pull --quiet "mirror.gcr.io/${image}"
  docker tag "mirror.gcr.io/${image}" "$local_name"
  # The CLI tries public.ecr.aws first; give it a local match there too.
  docker tag "mirror.gcr.io/${image}" "public.ecr.aws/supabase/${local_name##*/}"
done
