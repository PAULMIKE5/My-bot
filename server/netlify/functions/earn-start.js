const { openDb, getSetting } = require("./db.js");
const { nanoid } = require("nanoid");

module.exports.handler = async function(event) {
  const db = openDb();
  const { telegram_id } = JSON.parse(event.body);

  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(telegram_id);
  if (!u) return { statusCode: 404, body: "User not found" };

  if (u.is_frozen) return { statusCode: 403, body: "Account frozen" };

  const rewardPerAd = Number(getSetting(db, "reward_per_ad", "10"));
  const cooldown = Number(getSetting(db, "ad_cooldown_seconds", "30"));
  const dailyCap = Number(getSetting(db, "daily_ad_cap", "200"));

  const today = new Date().toISOString().slice(0, 10);
  if (u.ads_today_date !== today) {
    db.prepare("UPDATE users SET ads_today=0, ads_today_date=? WHERE telegram_id=?").run(today, telegram_id);
  }

  const now = Date.now();
  if (u.last_ad_at && (now - u.last_ad_at) < cooldown * 1000) {
    return { statusCode: 429, body: "Cooldown active" };
  }

  if (u.ads_today >= dailyCap) return { statusCode: 429, body: "Daily cap reached" };

  const providerEventId = nanoid();
  db.prepare("INSERT INTO earn_events(user_id, provider_event_id, type, amount, status, created_at) VALUES(?,?,?,?,?,?)")
    .run(u.id, providerEventId, "ad", rewardPerAd, "pending", now);

  const apiBase = `${event.headers["X-Forwarded-Proto"]}://${event.headers["Host"]}`;
  const redirectUrl = `${apiBase}/demo-ad?e=${providerEventId}&t=${encodeURIComponent(event.headers["Authorization"])}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ redirectUrl })
  };
};
