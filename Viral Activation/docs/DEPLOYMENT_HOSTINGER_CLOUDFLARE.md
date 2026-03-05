# Deploy Guide: Hostinger VPS + Cloudflare

## Target

- Admin domain: `admin.wc26nft.com`
- Reverse proxy: Nginx (VPS) -> Node Fastify process
- Proxy/CDN/WAF: Cloudflare
- DB: PostgreSQL
- Cache/session: Redis

## Cloudflare (recommended baseline)

1. DNS:
   - `admin.wc26nft.com` -> A record VPS IP, Proxy ON (orange cloud).
2. SSL/TLS:
   - Mode `Full (strict)`.
3. WAF:
   - Enable managed rules.
   - Add custom rule to challenge/block non-expected regions if needed.
4. Rate limit:
   - `100 req/min` per IP for `/api/*`.
5. Cache:
   - Bypass cache for `/api/*`.
   - Cache static assets (`/assets/*`, `*.js`, `*.css`, fonts) TTL 7 days.

## Nginx sample

```nginx
server {
  listen 80;
  server_name admin.wc26nft.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name admin.wc26nft.com;

  ssl_certificate /etc/letsencrypt/live/admin.wc26nft.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.wc26nft.com/privkey.pem;

  location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    root /var/www/wc26-admin;
    try_files $uri /index.html;
  }
}
```

## Process manager (systemd)

```ini
[Unit]
Description=WC26 Admin API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/wc26/Viral Activation/backend
ExecStart=/usr/bin/node dist/server.js
EnvironmentFile=/opt/wc26/Viral Activation/backend/.env
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

## Security checklist

- Keep Fastify port private (`127.0.0.1` only).
- Rotate JWT secrets periodically.
- Force `REQUIRE_TELEGRAM_SIGNATURE=true` in production.
- Enforce TOTP for `owner/admin`.
- Audit log retention >= 180 days.
- Backup PostgreSQL daily + Redis snapshot.
