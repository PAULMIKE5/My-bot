import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import { openDb, getSetting, setSetting, seedAdmin, audit } from "./db.js";
import { verifyInitData } from "./telegramVerify.js";
import { signUserJwt, signAdminJwt, requireUser, requireAdmin } from "./auth.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: function(origin, cb) {
    // Allow no-origin (curl, server-to-server) and configured origins
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked for origin: " + origin));
  },
  credentials: false
}));

const db = openDb();
seedAdmin(db, process.env.ADMIN_USERNAME || "admin", process.env.ADMIN_PASSWORD || "change-me-now");

function nowDay() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// ---- Mini App auth ----
app.post("/auth/telegram", (req, res) => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return res.status(500).send("Server not configured: BOT_TOKEN missing");

  const { initData } = req.body || {};
  const v = verifyInitData(initData, botToken);
  if (!v.ok) return res.status(401).send(v.error);

  const tUser = v.user;
  if (!tUser?.id) return res.status(400).send("Missing Telegram user");

  // Upsert user
  const existing = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(String(tUser.id));
  if (!existing) {
    db.prepare(`
      INSERT INTO users(telegram_id, first_name, username, created_at, ads_today_date)
      VALUES(?,?,?,?,?)
    `).run(String(tUser.id), tUser.first_name || null, tUser.username || null, Date.now(), nowDay());
  } else {
    db.prepare("UPDATE users SET first_name=?, username=? WHERE telegram_id=?")
      .run(tUser.first_name || existing.first_name, tUser.username || existing.username, String(tUser.id));
  }

  const token = signUserJwt({ type: "user", telegram_id: String(tUser.id) }, process.env.JWT_SECRET);
  res.json({ token, telegram_id: String(tUser.id) });
});

// ---- User endpoints ----
app.get("/me", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!u) return res.status(404).send("User not found");

  // daily reset
  const today = nowDay();
  if (u.ads_today_date !== today) {
    db.prepare("UPDATE users SET ads_today=0, ads_today_date=? WHERE telegram_id=?").run(today, tid);
    u.ads_today = 0;
    u.ads_today_date = today;
  }

  const rewardPerAd = Number(getSetting(db, "reward_per_ad", "10"));
  const cooldown = Number(getSetting(db, "ad_cooldown_seconds", "30"));
  const dailyCap = Number(getSetting(db, "daily_ad_cap", "200"));

  const now = Date.now();
  const canByCooldown = !u.last_ad_at || (now - u.last_ad_at) >= cooldown * 1000;
  const canByCap = u.ads_today < dailyCap;
  const canWatchAd = canByCooldown && canByCap && !u.is_frozen;

  res.json({
    telegramId: tid,
    firstName: u.first_name,
    username: u.username,
    balance: u.balance_available,
    pending: u.balance_pending,
    totalEarned: u.total_earned,
    todayEarned: 0, // you can compute from earn_events if you want
    adsLeftToday: Math.max(0, dailyCap - u.ads_today),
    rewardPerAd,
    canWatchAd,
    cooldownSeconds: cooldown,
    isFrozen: !!u.is_frozen
  });
});

app.get("/wallet", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!u) return res.status(404).send("User not found");
  res.json({
    available: u.balance_available,
    pending: u.balance_pending,
    totalEarned: u.total_earned
  });
});

app.get("/history", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const u = db.prepare("SELECT id FROM users WHERE telegram_id=?").get(tid);
  if (!u) return res.status(404).send("User not found");

  const earns = db.prepare("SELECT type, amount, status, created_at FROM earn_events WHERE user_id=? ORDER BY created_at DESC LIMIT 200").all(u.id);
  const wds = db.prepare("SELECT amount, method, status, created_at, updated_at, reject_reason FROM withdrawals WHERE user_id=? ORDER BY created_at DESC LIMIT 200").all(u.id);

  res.json({ earns, withdrawals: wds });
});

// Demo ad start: returns a server-hosted ad page with timer that calls /earn/complete
app.post("/earn/start", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!u) return res.status(404).send("User not found");
  if (u.is_frozen) return res.status(403).send("Account frozen");

  const rewardPerAd = Number(getSetting(db, "reward_per_ad", "10"));
  const cooldown = Number(getSetting(db, "ad_cooldown_seconds", "30"));
  const dailyCap = Number(getSetting(db, "daily_ad_cap", "200"));

  const today = nowDay();
  if (u.ads_today_date !== today) {
    db.prepare("UPDATE users SET ads_today=0, ads_today_date=? WHERE telegram_id=?").run(today, tid);
    u.ads_today = 0;
    u.ads_today_date = today;
  }

  const now = Date.now();
  if (u.last_ad_at && (now - u.last_ad_at) < cooldown * 1000) {
    return res.status(429).send("Cooldown active");
  }
  if (u.ads_today >= dailyCap) return res.status(429).send("Daily cap reached");

  // Create a provider_event_id for demo and store as pending
  const providerEventId = nanoid();
  db.prepare("INSERT INTO earn_events(user_id, provider_event_id, type, amount, status, created_at) VALUES(?,?,?,?,?,?)")
    .run(u.id, providerEventId, "ad", rewardPerAd, "pending", now);

  // Demo ad page (15s) then callback to /earn/complete?e=...
    const apiBase = `${req.protocol}://${req.get("host")}`;
  const redirectUrl = `${apiBase}/demo-ad?e=${providerEventId}&t=${encodeURIComponent(req.headers.authorization)}`;
  res.json({ redirectUrl });
});

// Demo ad page
app.get("/demo-ad", (req, res) => {
  const e = req.query.e;
  const t = req.query.t; // Authorization header value (Bearer ...)
  if (!e || !t) return res.status(400).send("Bad request");
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Demo Ad</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;padding:24px;background:#0f0f0f;color:#fff}
    .card{max-width:520px;margin:0 auto;background:rgba(255,255,255,.06);padding:18px;border-radius:16px}
    .bar{height:10px;background:rgba(255,255,255,.12);border-radius:999px;overflow:hidden;margin-top:14px}
    .bar>div{height:100%;width:0;background:#2ea6ff}
    button{width:100%;padding:14px;border-radius:14px;border:0;background:#2ea6ff;color:#fff;font-weight:800;font-size:15px;margin-top:16px;cursor:pointer}
    .muted{opacity:.75;font-size:13px;line-height:1.35}
  </style>
</head>
<body>
  <div class="card">
    <h2>Demo Ad</h2>
    <div class="muted">This is a test flow. In production you will show a real provider and verify completion server-side.</div>
    <div class="bar"><div id="p"></div></div>
    <div id="txt" class="muted" style="margin-top:10px;">Watching… 15s</div>
    <button id="btn" disabled>Finish & Claim Reward</button>
  </div>

  <script>
    const total = 15;
    let left = total;
    const p = document.getElementById('p');
    const txt = document.getElementById('txt');
    const btn = document.getElementById('btn');

    const timer = setInterval(() => {
      left -= 1;
      const done = total - left;
      p.style.width = (done/total*100) + '%';
      txt.textContent = 'Watching… ' + left + 's';
      if (left <= 0){
        clearInterval(timer);
        txt.textContent = 'Completed ✅';
        btn.disabled = false;
      }
    }, 1000);

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const r = await fetch('/earn/complete', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': decodeURIComponent('${t}') },
        body: JSON.stringify({ providerEventId: '${e}' })
      });
      if (!r.ok){
        alert(await r.text());
        btn.disabled = false;
        return;
      }
      alert('Reward credited! Return to Telegram.');
      // Closing is allowed inside a WebView; this page may be opened outside Telegram too.
      try{ window.Telegram?.WebApp?.close(); }catch(e){}
    });
  </script>
</body>
</html>`);
});

// Complete earn event (demo / provider callback)
app.post("/earn/complete", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const { providerEventId } = req.body || {};
  if (!providerEventId) return res.status(400).send("Missing providerEventId");

  const userRow = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!userRow) return res.status(404).send("User not found");

  const ev = db.prepare("SELECT * FROM earn_events WHERE provider_event_id=?").get(providerEventId);
  if (!ev) return res.status(404).send("Event not found");
  if (ev.status === "credited") return res.json({ ok: true, already: true });

  // Ensure event belongs to this user
  if (ev.user_id !== userRow.id) return res.status(403).send("Forbidden");

  // Credit
  db.prepare("UPDATE earn_events SET status='credited' WHERE id=?").run(ev.id);
  db.prepare("UPDATE users SET balance_available=balance_available+?, total_earned=total_earned+?, last_ad_at=?, ads_today=ads_today+1 WHERE id=?")
    .run(ev.amount, ev.amount, Date.now(), userRow.id);

  res.json({ ok: true, credited: ev.amount });
});

// Withdraw meta
app.get("/withdraw/meta", requireUser, (req, res) => {
  res.json({
    minWithdraw: Number(getSetting(db, "min_withdraw", "1000")),
    processingTime: getSetting(db, "processing_time", "24–72h"),
    methods: ["usdt", "paypal", "giftcard"],
    oneAtATime: getSetting(db, "one_withdrawal_at_a_time", "true") === "true"
  });
});

// Create withdrawal
app.post("/withdraw", requireUser, (req, res) => {
  const tid = req.user.telegram_id;
  const { amount, method, address } = req.body || {};
  const amt = Number(amount);

  if (!amt || amt <= 0) return res.status(400).send("Invalid amount");
  if (!method || !address) return res.status(400).send("Missing method/address");

  const minW = Number(getSetting(db, "min_withdraw", "1000"));
  if (amt < minW) return res.status(400).send("Below minimum withdrawal");

  const userRow = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!userRow) return res.status(404).send("User not found");
  if (userRow.is_frozen) return res.status(403).send("Account frozen");

  if (getSetting(db, "one_withdrawal_at_a_time", "true") === "true") {
    const pending = db.prepare("SELECT id FROM withdrawals WHERE user_id=? AND status='pending'").get(userRow.id);
    if (pending) return res.status(400).send("You already have a pending withdrawal");
  }

  if (userRow.balance_available < amt) return res.status(400).send("Insufficient balance");

  const now = Date.now();

  db.prepare("INSERT INTO withdrawals(user_id, amount, method, address, status, created_at, updated_at) VALUES(?,?,?,?,?,?,?)")
    .run(userRow.id, amt, String(method), String(address), "pending", now, now);

  // Move to pending balance
  db.prepare("UPDATE users SET balance_available=balance_available-?, balance_pending=balance_pending+? WHERE id=?")
    .run(amt, amt, userRow.id);

  res.json({ ok: true });
});

// ---- Admin auth ----
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).send("Missing credentials");

  const row = db.prepare("SELECT * FROM admin_users WHERE username=?").get(String(username));
  if (!row) return res.status(401).send("Invalid credentials");
  const ok = bcrypt.compareSync(String(password), row.password_hash);
  if (!ok) return res.status(401).send("Invalid credentials");

  const token = signAdminJwt({ type: "admin", admin_id: row.id, username: row.username, role: row.role }, process.env.JWT_SECRET);
  res.json({ token });
});

// Admin: withdrawals list
app.get("/admin/withdrawals", requireAdmin, (req, res) => {
  const status = String(req.query.status || "pending");
  const q = String(req.query.q || "").trim();

  let sql = `
    SELECT w.id, w.amount, w.method, w.address, w.status, w.created_at, w.updated_at,
           w.reject_reason, w.admin_note,
           u.telegram_id as userTelegramId, u.is_frozen as isFrozen
    FROM withdrawals w
    JOIN users u ON u.id = w.user_id
    WHERE w.status = ?
  `;
  const params = [status];

  if (q) {
    sql += " AND (u.telegram_id LIKE ? OR w.method LIKE ? OR w.address LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  sql += " ORDER BY w.created_at DESC LIMIT 500";

  const items = db.prepare(sql).all(...params);
  res.json({ items });
});

// Admin: approve withdrawal
app.post("/admin/withdrawals/:id/approve", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const w = db.prepare("SELECT * FROM withdrawals WHERE id=?").get(id);
  if (!w) return res.status(404).send("Not found");
  if (w.status !== "pending") return res.status(400).send("Not pending");

  const now = Date.now();
  db.prepare("UPDATE withdrawals SET status='approved', updated_at=? WHERE id=?").run(now, id);

  // Deduct from pending balance (already moved from available at request time)
  db.prepare("UPDATE users SET balance_pending=balance_pending-? WHERE id=?").run(w.amount, w.user_id);

  audit(db, req.admin.admin_id, "withdrawal_approved", "withdrawal", String(id), { amount: w.amount });
  res.json({ ok: true });
});

// Admin: reject withdrawal
app.post("/admin/withdrawals/:id/reject", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body || {};
  const w = db.prepare("SELECT * FROM withdrawals WHERE id=?").get(id);
  if (!w) return res.status(404).send("Not found");
  if (w.status !== "pending") return res.status(400).send("Not pending");

  const now = Date.now();
  db.prepare("UPDATE withdrawals SET status='rejected', reject_reason=?, updated_at=? WHERE id=?")
    .run(reason ? String(reason) : "Rejected by admin", now, id);

  // Return funds from pending to available
  db.prepare("UPDATE users SET balance_pending=balance_pending-?, balance_available=balance_available+? WHERE id=?")
    .run(w.amount, w.amount, w.user_id);

  audit(db, req.admin.admin_id, "withdrawal_rejected", "withdrawal", String(id), { amount: w.amount, reason });
  res.json({ ok: true });
});

// Admin: list users (basic)
app.get("/admin/users", requireAdmin, (req, res) => {
  const q = String(req.query.q || "").trim();
  let sql = "SELECT telegram_id, first_name, username, balance_available, balance_pending, total_earned, is_frozen, created_at FROM users";
  const params = [];
  if (q) {
    sql += " WHERE telegram_id LIKE ? OR username LIKE ? OR first_name LIKE ?";
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += " ORDER BY created_at DESC LIMIT 500";
  const items = db.prepare(sql).all(...params);
  res.json({ items });
});

// Admin: freeze/unfreeze
app.post("/admin/users/:telegramId/freeze", requireAdmin, (req, res) => {
  const tid = String(req.params.telegramId);
  const { freeze } = req.body || {};
  const val = freeze ? 1 : 0;
  db.prepare("UPDATE users SET is_frozen=? WHERE telegram_id=?").run(val, tid);
  audit(db, req.admin.admin_id, freeze ? "user_frozen" : "user_unfrozen", "user", tid, null);
  res.json({ ok: true });
});

// Admin: adjust user balance (add/remove)
app.post("/admin/users/:telegramId/adjust", requireAdmin, (req, res) => {
  const tid = String(req.params.telegramId);
  const { delta, reason } = req.body || {};
  const d = Number(delta);
  if (!Number.isFinite(d) || d === 0) return res.status(400).send("Invalid delta");

  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(tid);
  if (!u) return res.status(404).send("User not found");

  // Prevent negative available balance
  if (d < 0 && u.balance_available + d < 0) return res.status(400).send("Would make balance negative");

  db.prepare("UPDATE users SET balance_available=balance_available+? WHERE telegram_id=?").run(d, tid);
  audit(db, req.admin.admin_id, "balance_adjusted", "user", tid, { delta: d, reason: reason || null });
  res.json({ ok: true });
});

// Admin: settings get/set
app.get("/admin/settings", requireAdmin, (req, res) => {
  const keys = ["reward_per_ad", "min_withdraw", "ad_cooldown_seconds", "daily_ad_cap", "one_withdrawal_at_a_time", "processing_time"];
  const out = {};
  for (const k of keys) out[k] = getSetting(db, k, null);
  res.json(out);
});

app.post("/admin/settings", requireAdmin, (req, res) => {
  const body = req.body || {};
  const allowed = new Set(["reward_per_ad", "min_withdraw", "ad_cooldown_seconds", "daily_ad_cap", "one_withdrawal_at_a_time", "processing_time"]);
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) setSetting(db, k, v);
  }
  audit(db, req.admin.admin_id, "settings_updated", "settings", "global", body);
  res.json({ ok: true });
});

// Admin: audit logs
app.get("/admin/audit", requireAdmin, (req, res) => {
  const items = db.prepare(`
    SELECT a.id, a.action, a.target_type, a.target_id, a.meta_json, a.created_at, u.username
    FROM audit_logs a
    JOIN admin_users u ON u.id = a.admin_id
    ORDER BY a.created_at DESC
    LIMIT 500
  `).all();
  res.json({ items });
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log("API server listening on port", PORT);
});
