# JE TV — Professional IPTV Web App

## Included APIs

- `GET /api/health` — API health check
- `GET /api/playlist` — channel list
- `GET /api/search?q=bbc` — channel search
- `GET /api/banner` — banner data
- `GET /api/notice` — notice data
- `GET /api/version` — version/update data
- `GET /api/config` — app configuration
- `GET /api/premium?password=...` — premium content
- `GET /api/stream?url=...` — HLS/HTTP stream proxy

## Important production changes

### 1. Do not expose secrets in frontend code
Use Vercel Environment Variables for configuration and premium authentication.

### 2. Premium authentication
The API supports `PREMIUM_PASSWORD_HASH` (SHA-256). For a serious production app, replace password authentication with a real user/session system.

### 3. Stream proxy
The stream API only proxies hosts currently present in `playlist.json`. It also rewrites nested HLS URLs so segments and keys can continue through the proxy.

### 4. Playlist pipeline
`channels.csv` remains the source for the GitHub Actions build. `scripts/build.py` creates `playlist.json` and `playlist.m3u`.

## Deployment

This project is structured for Vercel-style serverless functions:

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Set the environment variables from `.env.example` where needed.
4. Deploy.
5. Test `/api/health`.

## Legal / operational note

Only publish and proxy streams that you are authorized to distribute. Channel URLs can expire, block regions, require tokens, or stop working without notice.


# Google Sheets = Single Source of Truth

JE TV is now designed so that **you do not edit playlist.json/channels.csv to manage channels**.

Edit the Google Sheet and the same data flows to:

- Web TV
- Android app
- `/api/playlist`
- `/api/search`
- `/api/m3u`
- Stream player
- Admin tools using the API

### Data flow

Google Sheets
    ↓
`/api/playlist`
    ↓
Web / Android / TV clients

Google Apps Script `onEdit`
    ↓
`POST /api/sync`
    ↓
Refresh API cache immediately

### New endpoints

- `GET /api/m3u` — dynamically generated M3U from Google Sheets
- `POST /api/sync` — force a Sheet refresh (protected by `SHEET_SYNC_SECRET`)
- `GET /api/playlist` — live channel data
- `GET /api/config` — tells clients how often to refresh

The web app automatically refreshes channel data every `CLIENT_REFRESH_MS` milliseconds. Android should do the same using WorkManager/coroutines or a foreground refresh strategy appropriate to the app.

For true real-time behavior, keep the Apps Script trigger installed. The client polling remains a safety net.
