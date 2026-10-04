#!/usr/bin/env bash
set -euo pipefail

if [[ "${CLAUDE_CODE_REMOTE:-}" != 'true' ]]; then
  exit 0
fi

task_repo_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$task_repo_dir"
task_node_version="$(tr -d '\r\n' < .nvmrc)"
case "$(uname -m)" in
  x86_64) task_node_arch='x64' ;;
  aarch64) task_node_arch='arm64' ;;
  *) echo 'Telemart cloud: unsupported Linux architecture.' >&2; exit 1 ;;
esac
task_node_bin="/opt/telemart-cloud/node-v${task_node_version}-linux-${task_node_arch}/bin"
if [[ ! -x "${task_node_bin}/node" ]]; then
  echo 'Telemart cloud: Node 24 setup is missing; check the cloud environment setup script.' >&2
  exit 1
fi

export PATH="${task_node_bin}:${PATH}"
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  printf 'export PATH=%q:"$PATH"\n' "$task_node_bin" >> "$CLAUDE_ENV_FILE"
fi

task_lock_sum="$(sha256sum package-lock.json | awk '{print $1}')"
task_cached_sum=''
if [[ -f node_modules/.telemart-lock.sha ]]; then
  task_cached_sum="$(cat node_modules/.telemart-lock.sha)"
fi
if [[ "$task_cached_sum" != "$task_lock_sum" || ! -x node_modules/.bin/next ]]; then
  npm ci --include=dev --no-fund --no-audit
  printf '%s\n' "$task_lock_sum" > node_modules/.telemart-lock.sha
fi

node --version
npm --version
