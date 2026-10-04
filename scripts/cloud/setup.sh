#!/usr/bin/env bash
set -euo pipefail

# Repository-local Linux setup. Claude Cloud's environment Setup field uses
# environment-setup.sh instead; SessionStart installs packages per checkout.
task_repo_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$task_repo_dir"

if [[ ! -f package.json || ! -f package-lock.json || ! -f .nvmrc ]]; then
  echo 'Telemart setup: run from the repository root with package.json, package-lock.json and .nvmrc.' >&2
  exit 1
fi
if [[ "$(uname -s)" != 'Linux' ]]; then
  echo 'Telemart setup: this Bash script is for the Linux cloud environment.' >&2
  exit 1
fi

task_node_version="$(tr -d '\r\n' < .nvmrc)"
if [[ "$task_node_version" != '24.18.0' ]]; then
  echo 'Telemart setup: .nvmrc and the cloud toolchain script must agree.' >&2
  exit 1
fi

case "$(uname -m)" in
  x86_64) task_node_arch='x64' ;;
  aarch64) task_node_arch='arm64' ;;
  *) echo 'Telemart setup: unsupported Linux architecture.' >&2; exit 1 ;;
esac

task_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${task_script_dir}/environment-setup.sh"
task_node_dir="/opt/telemart-cloud/node-v${task_node_version}-linux-${task_node_arch}"

export PATH="${task_node_dir}/bin:${PATH}"
if [[ "$(node --version)" != "v${task_node_version}" ]]; then
  echo 'Telemart setup: Node version does not match .nvmrc.' >&2
  exit 1
fi

npm ci --include=dev --no-fund --no-audit
sha256sum package-lock.json | awk '{print $1}' > node_modules/.telemart-lock.sha
node --version
npm --version
