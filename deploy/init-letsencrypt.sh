#!/bin/sh
set -eu

if [ ! -f .env ]; then
  echo "Falta .env en la raíz. Copia .env.example y completa los valores."
  exit 1
fi

# shellcheck disable=SC1091
. ./.env

if [ -z "${CERTBOT_EMAIL:-}" ] || [ -z "${STOREFRONT_HOST:-}" ] || [ -z "${ADMIN_HOST:-}" ] || [ -z "${API_HOST:-}" ]; then
  echo "Define CERTBOT_EMAIL, STOREFRONT_HOST, ADMIN_HOST y API_HOST en .env"
  exit 1
fi

CERT_NAME="${SSL_CERT_NAME:-$STOREFRONT_HOST}"

docker compose up -d postgres backend storefront admin nginx

docker compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm --entrypoint certbot certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --cert-name "$CERT_NAME" \
  -d "$STOREFRONT_HOST" \
  -d "$ADMIN_HOST" \
  -d "$API_HOST"

docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx certbot
