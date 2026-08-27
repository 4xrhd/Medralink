#!/usr/bin/env bash
# ==============================================================================
# MedraLink Network Teardown Script
# Stops all containers, removes networks and state volumes
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
cd "$NETWORK_DIR"

if command -v podman-compose &> /dev/null; then
    COMPOSE="podman-compose"
elif command -v docker &> /dev/null; then
    COMPOSE="docker compose"
else
    echo "⚠️ No container runtime found."
    exit 0
fi

echo "🛑 Stopping and cleaning MedraLink network..."
$COMPOSE down -v --remove-orphans
echo "✅ MedraLink Network cleaned successfully."
