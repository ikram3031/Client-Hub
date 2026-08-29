#!/usr/bin/env bash

# ==============================================================================
# White-Label MongoDB Cloudflare R2 Automated Backup Script
# Location: /opt/<client>/scripts/backup-to-r2.sh
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Execute zero-dependency Node.js R2 S3 Streamer
node "$SCRIPT_DIR/backup-to-r2.js" "$@"
