# Portable Deployment

## Recommended Target

Build and deploy the Docker image on a VPS or a platform that accepts custom containers (for example, Render, Railway, Fly.io, or a cloud container service). The image runs PHP 8.3, PHP-FPM, and Nginx; Nginx serves only `public/` and sends application routes to CodeIgniter.

This is not a static-site deployment. Vercel does not provide an official PHP runtime. Its community PHP runtime is a separate option and requires Vercel-specific routing and packaging; this Docker image is for container hosts.

## Local Compose

1. Create a local `.env` from `.env.example`.
2. Generate a unique encryption key with `php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"` and put it in `ENCRYPTION_KEY`. Never commit `.env` or reuse the example value.
3. Set `APP_BASE_URL` to the public origin, including the trailing slash. For local Compose, use `http://localhost:8080/`.
4. Start with `docker compose up --build` and open `http://localhost:8080`.

The app port binds to loopback by default, so it is not directly exposed to the public network. In production, put it behind a TLS reverse proxy or the platform's HTTPS ingress. Set `APP_BASE_URL` to the HTTPS URL. Set `APP_FORCE_HTTPS=true` only when the trusted ingress forwards `X-Forwarded-Proto: https`; do not trust forwarded headers from arbitrary public clients.

## Platform Settings

Configure these as platform environment variables or secrets:

- `PORT`: HTTP port provided by the container host.
- `APP_BASE_URL`: the site's public HTTPS origin, ending in `/`.
- `APP_FORCE_HTTPS`: `true` only when the platform's trusted proxy forwards the original HTTPS scheme.
- `ENCRYPTION_KEY`: a newly generated, private CodeIgniter encryption key.

Do not expose `app/`, `vendor/`, `.env`, or `writable/` as a web root. The container's document root is fixed at `public/`. The writable directory is stored in a Docker volume for single-host Compose deployments; distributed deployments should use shared session storage such as Redis and external persistent storage where needed.

## Current Application Limitations

The current attendance UI is still a prototype. Attendance records and uploaded student photos are browser-local demo data; there is no authentication, database-backed attendance, or server-side authorization yet. A writable Docker volume does not turn browser-local data into a school database. Do not use this prototype for real student records until authentication, database persistence, authorization, backup, and privacy requirements are implemented and tested.
