#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${APP_BASE_URL:?Set APP_BASE_URL to the public URL, including the trailing slash}"
: "${ENCRYPTION_KEY:?Set ENCRYPTION_KEY to a unique random key}"

case "$PORT" in
    *[!0-9]*|'')
        echo "PORT must be a number" >&2
        exit 1
        ;;
esac

export PORT
sed "s/\${PORT}/${PORT}/g" \
    /etc/nginx/http.d/default.conf.template \
    > /etc/nginx/http.d/default.conf

exec env \
    "app.baseURL=${APP_BASE_URL}" \
    "encryption.key=${ENCRYPTION_KEY}" \
    "app.forceGlobalSecureRequests=${APP_FORCE_HTTPS:-false}" \
    "CI_ENVIRONMENT=production" \
    "$@"