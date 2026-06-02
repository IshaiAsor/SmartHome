#!/bin/sh
set -e

BASE_URL="${OTA_BASE_URL:-http://ota-manager}"
VERSION="${FIRMWARE_VERSION}"

if [ -z "$VERSION" ]; then
  echo "ERROR: FIRMWARE_VERSION is not set in the image"
  exit 1
fi

for dir in /firmware/*/; do
  device=$(basename "$dir")
  bin="$dir/firmware.bin"
  [ -f "$bin" ] || continue

  target="/app/firmware/$device"
  mkdir -p "$target"
  cp "$bin" "$target/${VERSION}.bin"

  cat > "$target/latest.json" <<EOF
{"version":"$VERSION","deviceType":"$device","url":"$BASE_URL/download/$device/${VERSION}.bin","releaseNotes":"Auto-release $VERSION","timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
  echo "Registered $device $VERSION → $target"
done
