#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# collect-metrics.sh — Aggregate scan results into docs/data/metrics.json
# Run this after all scans have produced their metrics JSON files
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

ARTIFACTS_DIR="${1:-./all-artifacts}"
OUTPUT_FILE="./docs/data/metrics.json"
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "📊 Collecting metrics from: $ARTIFACTS_DIR"

python3 << PYEOF
import json, os, glob, time, sys

artifacts = "$ARTIFACTS_DIR"
output    = "$OUTPUT_FILE"

tool_files = {
    "semgrep":    "semgrep-metrics.json",
    "sonarcloud": "sonarcloud-metrics.json",
    "owasp_zap":  "zap-metrics.json",
    "w3af":       "w3af-metrics.json"
}

result = {
    "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "tools": {}
}

for tool, filename in tool_files.items():
    matches = glob.glob(f"{artifacts}/**/{filename}", recursive=True)
    if not matches:
        matches = glob.glob(f"./{filename}", recursive=False)
    if matches:
        try:
            with open(matches[0]) as f:
                result["tools"][tool] = json.load(f)
            print(f"  ✅ {tool}: loaded from {matches[0]}")
        except Exception as e:
            print(f"  ⚠️  {tool}: parse error — {e}")
            result["tools"][tool] = {"error": str(e)}
    else:
        print(f"  ⚠️  {tool}: no metrics file found")
        result["tools"][tool] = {"status": "not_found"}

with open(output, "w") as f:
    json.dump(result, f, indent=2)

print(f"\n✅ Metrics written to {output}")
print(json.dumps(result, indent=2))
PYEOF
