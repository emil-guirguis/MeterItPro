#!/bin/bash
# Run this on the machine with the existing database to export the schema.
# The output goes into docker/init/00-schema.sql which Postgres applies
# automatically on first container startup (when the pgdata volume is empty).
#
# Usage:
#   chmod +x sync/docker/dump-schema.sh
#   ./sync/docker/dump-schema.sh
#
# Adjust the connection variables below if needed.

HOST=${POSTGRES_SYNC_HOST:-localhost}
PORT=${POSTGRES_SYNC_PORT:-5432}
DB=${POSTGRES_SYNC_DB:-meterit}
USER=${POSTGRES_SYNC_USER:-meterituser}

OUTPUT="$(dirname "$0")/init/00-schema.sql"

echo "Dumping schema from $USER@$HOST:$PORT/$DB ..."
pg_dump \
  --host="$HOST" \
  --port="$PORT" \
  --username="$USER" \
  --schema-only \
  --no-owner \
  --no-acl \
  "$DB" > "$OUTPUT"

echo "Schema written to $OUTPUT"
echo "Commit this file so new machines get the full schema on first boot."
