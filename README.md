# Telegram Earn Mini App + Admin Panel (React) + Backend (Node/Express)

This repo contains:
- `apps/miniapp` — Telegram Mini App (React + Vite)
- `apps/admin`  — Admin Panel (React + Vite)
- `server`      — Backend API (Node.js + Express + SQLite)

## Default economics (as requested)
- Reward per ad: **10 coins**
- Minimum withdrawal: **1000 coins**
- Admin can **add/remove** user balance.

> Important: This project includes a **demo ad flow** (a simple timer page) so you can test end‑to‑end.
> For real monetization, integrate a rewarded/offerwall provider and credit only after server verification.

---

## 1) Prerequisites
- Node.js 18+ (recommended)
- A public HTTPS domain for the Mini App (Telegram requires HTTPS)
- Telegram bot token from @BotFather

---

## 2) Configure environment variables

Create `server/.env`:

```env
BOT_TOKEN=PASTE_YOUR_BOT_TOKEN
JWT_SECRET=replace_with_a_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
PORT=8080
```

Notes:
- `ALLOWED_ORIGINS` should include the Mini App and Admin Panel URLs (in production use your HTTPS domains).
- Admin credentials are used to seed the admin user on first run.

---

## 3) Install & run (local development)

### Backend
```bash
cd server
npm install
npm run dev
```
Backend runs on: `http://localhost:8080`

### Mini App
```bash
cd ../apps/miniapp
npm install
npm run dev
```
Mini App runs on: `http://localhost:5173`

### Admin Panel
```bash
cd ../admin
npm install
npm run dev
```
Admin runs on: `http://localhost:5174`

---

## 4) Connect the Mini App to your bot

1. In @BotFather set:
   - `/setdomain` → your Mini App domain (must be HTTPS)
2. In your bot, send a button that opens the web app (Mini App URL).

Example bot code (Python):
```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
keyboard = [[InlineKeyboardButton("Open Earn App", web_app={"url": "https://YOUR_DOMAIN"})]]
```

---

## 5) Production launch (recommended approach)
You need 3 deployments:
1. **API server** (Node) — e.g. Render/Fly.io/VPS
2. **Mini App** (static) — Vercel/Netlify/Cloudflare Pages
3. **Admin Panel** (static) — Vercel/Netlify (protect via login + IP allowlist)

### Build commands
Mini App:
```bash
cd apps/miniapp
npm run build
```
Admin:
```bash
cd apps/admin
npm run build
```

### Set production URLs
- Set `VITE_API_BASE` for both frontends to your backend URL, e.g. `https://api.yourdomain.com`

---

## 6) Key admin features
- Approve/reject withdrawals
- Add/remove user balance (delta adjustments)
- Freeze/unfreeze users
- Change settings (min withdraw, reward per ad, cooldown, daily cap)
- Audit logs for all admin actions

---

## 7) Security checklist (do not skip)
- Keep `JWT_SECRET` private and long
- Validate Telegram `initData` (already implemented in backend)
- Do not credit rewards on the frontend (backend only)
- Add rate limits and IP/device logging for production

---

## 8) Default Admin Login
From `server/.env`:
- Username: `ADMIN_USERNAME` (default `admin`)
- Password: `ADMIN_PASSWORD` (default `change-me-now`)

Change these immediately in production.
