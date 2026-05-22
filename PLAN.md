# Kimut Clinic — Deployment + Umami Analytics Rollout

## Overview

Host the SvelteKit app on the existing Hostinger VPS (where n8n already runs), then self-host
Umami on the same VPS so traffic analytics feed into the `/admin` dashboard via an iframe embed.

**Stack after completion:**
- `clinic.<domain>` → SvelteKit app (Node + PM2 or Docker)
- `umami.<domain>` → Self-hosted Umami (Docker + Postgres)
- `n8n.srv1305434.hstgr.cloud` → n8n (unchanged for now)
- Supabase → still the DB for leads + funnel_events (Umami is additive, not a replacement)

---

## Status

| Phase | Description | Status |
|---|---|---|
| 0 | Local code prep | ✅ Done |
| 1 | VPS recon + DNS | ✅ Done |
| 2 | Deploy SvelteKit | ✅ Done |
| 3 | Self-host Umami | ✅ Done |
| 4 | Wire tracking + admin iframe | ✅ Done |
| 5 | n8n daily digest workflow | ✅ Done |

---

## Phase 0 — Local code prep ✅

**Already done — do not redo.**

Changes committed in `ddffd9c`:
- Swapped `@sveltejs/adapter-auto` → `@sveltejs/adapter-node`; added `"start": "node build/index.js"` script
- Hardcoded n8n hostname removed from two server routes; now reads `N8N_BASE_URL` from env
  - `src/routes/api/submit-assessment/+server.js`
  - `src/routes/admin/update-status/+server.js`
- `captureUTMs()` wired in `src/routes/+layout.svelte` (fires on page load, skipped on `/admin`)
- `.env.example` created with all required keys
- `.gitattributes` added for LF normalization (Windows → Linux)
- Git repo initialized; initial commit made

**Remaining manual steps (do before Phase 1):**
1. Create a private GitHub repo (`kimut-clinic`) and push:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/kimut-clinic.git
   git push -u origin master
   ```
2. Rotate the Google service-account key in Google Cloud Console (precaution now that a repo exists),
   update `GOOGLE_PRIVATE_KEY` in your local `.env`.

---

## Phase 1 — VPS recon + DNS ⬜

**Goal:** Know what's on the VPS before touching it, and get DNS propagating.

### 1.1 — SSH + audit (run these; share output so Claude can advise)
```bash
cat /etc/os-release
docker --version && docker ps
docker compose version
systemctl status nginx 2>/dev/null || echo "no nginx service"
ss -tlnp | grep -E ':(80|443|5678|3000)'
df -h && free -h
certbot certificates 2>/dev/null || echo "no certbot"
ls ~/  # see what directories exist
```

### 1.2 — Add DNS A records (Hostinger hPanel)
Go to **hPanel → Domains → your domain → DNS Zone**, add two A records:

| Name | Type | Value | TTL |
|---|---|---|---|
| `clinic` | A | `<VPS public IP>` | 3600 |
| `umami` | A | `<VPS public IP>` | 3600 |

Leave the openclaw record untouched.

### 1.3 — Confirm firewall
```bash
ufw status    # or iptables -L if no ufw
```
Ports 80 and 443 must be open inbound. Do NOT expose 3001 (Umami) or 5432 (Postgres) publicly.

---

## Phase 2 — Deploy SvelteKit to `clinic.<domain>` ⬜

**Depends on Phase 1 output (Docker vs native).** Two paths:

### Path A — Native Node + PM2 (if n8n runs natively)
```bash
# On VPS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
git clone https://github.com/YOUR_USERNAME/kimut-clinic.git ~/kimut-clinic
cd ~/kimut-clinic
cp /path/to/.env .env           # create this with production values
npm ci
npm run build
pm2 start build/index.js --name kimut-clinic
pm2 save && pm2 startup
```

### Path B — Docker (if n8n is in Docker)
Create `~/kimut-clinic/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build/index.js"]
```
Add `kimut-clinic` service to existing `docker-compose.yml`:
```yaml
kimut-clinic:
  build: ./kimut-clinic
  restart: unless-stopped
  ports:
    - "127.0.0.1:3000:3000"
  env_file: ./kimut-clinic/.env
```

### nginx server block (`/etc/nginx/sites-available/clinic.<domain>`)
```nginx
server {
    listen 80;
    server_name clinic.<domain>;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/clinic.<domain> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d clinic.<domain>
```

### Production `.env` on VPS (fill in real values)
```
PUBLIC_SUPABASE_URL=https://qhhxiplzmxtxlkmmaqxs.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your anon key>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account email>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=<calendar id>
N8N_BASE_URL=https://n8n.srv1305434.hstgr.cloud
# Umami keys added after Phase 3:
# PUBLIC_UMAMI_SCRIPT_URL=
# PUBLIC_UMAMI_WEBSITE_ID=
# PUBLIC_UMAMI_SHARE_URL=
```

### Verify Phase 2
- [ ] `https://clinic.<domain>` loads the landing page over valid TLS
- [ ] Submit a test booking → Supabase row created + n8n intake execution shows success
- [ ] `/admin/login` works; `/admin` shows leads and funnel events
- [ ] Change a lead's status → Google Sheet row updates via the status-update webhook
- [ ] n8n at `n8n.srv1305434.hstgr.cloud` is still reachable and healthy

---

## Phase 3 — Self-host Umami at `umami.<domain>` ⬜

### 3.1 — Docker Compose (`~/umami/docker-compose.yml`)
```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      DATABASE_URL: postgresql://umami:CHANGE_ME@umami-db:5432/umami
      APP_SECRET: GENERATE_A_LONG_RANDOM_STRING
    depends_on:
      umami-db:
        condition: service_healthy

  umami-db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: CHANGE_ME
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  umami-db-data:
```
```bash
cd ~/umami && docker compose up -d
```

### 3.2 — nginx + TLS for `umami.<domain>`
```nginx
server {
    listen 80;
    server_name umami.<domain>;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/umami.<domain> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d umami.<domain>
```

### 3.3 — First-time Umami setup (one time)
1. Browse to `https://umami.<domain>` → log in with `admin` / `umami` → **change the password immediately**
2. Settings → Websites → Add website → enter your domain → save
3. Copy the **Website ID (UUID)** and note the tracking script URL (`https://umami.<domain>/script.js`)
4. Settings → Websites → Share → enable → copy the **share URL** (used for the admin iframe)
5. Settings → API Keys → create a key (used for Phase 5 n8n workflow)

### Fixes applied during Phase 3
- **YAML indentation**: top-level `networks:` and `volumes:` blocks were initially indented under `services:` — fixed manually in nano.
- **`n8n_default` sibling network**: `n8n_default:` was indented under `umami_internal:` instead of being a sibling — fixed with `sed`.
- **Traefik network ambiguity**: umami container is on two networks (`umami_internal` + `n8n_default`); Traefik picked the wrong one and returned 504. Fixed by adding `traefik.docker.network=n8n_default` label to the umami service.

### Verify Phase 3
- [x] `https://umami.<domain>/script.js` returns JS (200 OK)
- [x] Umami UI loads at `https://umami.<domain>`
- [x] Default credentials changed

---

## Phase 4 — Wire tracking + embed admin iframe ⬜

### 4.1 — Add Umami env vars
Add to production `.env` on VPS (then rebuild/restart the app):
```
PUBLIC_UMAMI_SCRIPT_URL=https://umami.<domain>/script.js
PUBLIC_UMAMI_WEBSITE_ID=<uuid from step 3.3>
PUBLIC_UMAMI_SHARE_URL=https://umami.<domain>/share/<token>/<site-name>
```

### 4.2 — Inject tracking script
**File:** `src/routes/+layout.svelte`

Replace placeholder section — Claude will make this edit. The script tag goes inside
`<svelte:head>`, gated to non-`/admin` paths, reading from `$env/static/public`.

### 4.3 — Replace admin placeholder with iframe
**File:** `src/routes/admin/+page.svelte` lines ~175–186 (the dashed-border placeholder)

Claude will replace with a sandboxed `<iframe>` pointing at `PUBLIC_UMAMI_SHARE_URL`.

### Fixes applied during Phase 4
- **`<svelte:head>` constraint**: first attempt wrapped `<svelte:head>` in `{#if}`, which Svelte 5 disallows. Fixed by moving `{#if}` inside `<svelte:head>`.
- **Iframe CSP block**: Umami's share page sets `Content-Security-Policy: frame-ancestors 'self'`, blocking the embed. `ALLOWED_FRAME_URLS` env var had no effect on the pre-built image. Fixed via two Traefik response-header middleware labels on the umami service:
  ```
  traefik.http.middlewares.umami-frames.headers.customResponseHeaders.X-Frame-Options=
  traefik.http.middlewares.umami-frames.headers.customResponseHeaders.Content-Security-Policy=frame-ancestors *
  traefik.http.routers.umami.middlewares=umami-frames
  ```

### Verify Phase 4
- [x] Open `https://clinic.<domain>` in incognito → within 30 s a pageview appears in Umami
- [x] Log into `/admin` → no pageview tracked (gating works)
- [x] `/admin` Funnel Analytics tab shows the Umami iframe
- [x] Existing KPI cards (Total Submissions, Confirmed Patients, Conversion Rate) unchanged

---

## Phase 5 — n8n daily digest workflow ⬜

**Goal:** A scheduled n8n workflow that pulls yesterday's stats from the Umami API and sends
an email summary.

### Workflow shape (build in n8n UI, then export JSON to `n8n-workflows/`)
```
Cron (08:00 Asia/Manila daily)
  → HTTP Request: GET https://umami.<domain>/api/websites/<id>/stats
      headers: { x-umami-api-key: <key from step 3.3> }
      params:  startAt=<yesterday 00:00 epoch ms>, endAt=<yesterday 23:59 epoch ms>
  → Code node: format into readable text
  → Send Email / Telegram / etc.
```

**Optional:** second workflow that fetches `patient_leads` count from Supabase on the same
schedule and correlates it with Umami's unique visitor count to produce a true
traffic-to-booking conversion rate.

### Verify Phase 5
- [ ] Manually trigger the workflow in n8n → summary message received
- [ ] Numbers are non-zero (if Phase 4 tracking is live and some visits have occurred)
- [x] Export workflow JSON to `n8n-workflows/umami-daily-digest.json` and commit

---

## Key files changed in this rollout

| File | What changed |
|---|---|
| `package.json` | adapter-node dep + start script |
| `svelte.config.js` | adapter import |
| `src/routes/api/submit-assessment/+server.js` | n8n URL → `N8N_BASE_URL` env |
| `src/routes/admin/update-status/+server.js` | n8n URL → `N8N_BASE_URL` env |
| `src/routes/+layout.svelte` | captureUTMs wired; Umami script tag (Phase 4) |
| `src/routes/admin/+page.svelte` | Umami iframe replaces placeholder (Phase 4) |
| `.env.example` | All keys documented |
| `.gitattributes` | LF normalization |
| `n8n-workflows/umami-daily-digest.json` | Phase 5 export |

## Env vars reference

| Key | Where used | When added |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | throughout | existing |
| `PUBLIC_SUPABASE_ANON_KEY` | throughout | existing |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | calendar API | existing |
| `GOOGLE_PRIVATE_KEY` | calendar API | existing |
| `GOOGLE_CALENDAR_ID` | calendar API | existing |
| `N8N_BASE_URL` | submit-assessment, update-status | Phase 0 |
| `PUBLIC_UMAMI_SCRIPT_URL` | root layout | Phase 4 |
| `PUBLIC_UMAMI_WEBSITE_ID` | root layout | Phase 4 |
| `PUBLIC_UMAMI_SHARE_URL` | admin dashboard | Phase 4 |
