#!/bin/sh
set -e

# Apply pending migrations before the API starts.
echo "[entrypoint] Running database migrations..."
node ./node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run

# Optional demo data (idempotent: skipped when it already exists).
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] Seeding demo data..."
  node dist/database/seeds/run-seed.js
fi

exec "$@"
