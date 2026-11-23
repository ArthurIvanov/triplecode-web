#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
test -s .env.smtp-password
export TRIPLECODE_SMTP_PASSWORD="$(cat .env.smtp-password)"
exec docker --context desktop-linux compose --env-file .env.production -f compose.public.yaml "$@"
