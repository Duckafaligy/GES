#!/usr/bin/env bash
# Package a client-preview build folder into a clean .zip for portal upload.
# Usage: scripts/package.sh path/to/<client-slug>
# The folder MUST contain index.html at its root.
set -euo pipefail

dir="${1:-}"
if [ -z "$dir" ] || [ ! -d "$dir" ]; then
  echo "usage: package.sh <build-folder>   (folder containing index.html)"; exit 1
fi
if [ ! -f "$dir/index.html" ]; then
  echo "error: $dir has no index.html at its root — the portal needs one."; exit 1
fi

base="$(basename "$dir")"
parent="$(cd "$dir/.." && pwd)"
out="$parent/$base.zip"
rm -f "$out"
( cd "$parent" && zip -rq "$base.zip" "$base" -x '*.DS_Store' '*/.*' )
echo "packaged: $out"
unzip -l "$out"
