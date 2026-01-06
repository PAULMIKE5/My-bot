const { openDb, getSetting } = require("./db.js");

module.exports.handler = async function(event) {
  const db = openDb();
  const { telegram_id } = event.queryStringParameters;

  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(telegram_id);
  if (!u) return { statusCode: 404, body: "User not found" };

  const rewardPerAd = Number(getSetting(db, "reward_per_ad", "10"));
  const cooldown = Number(getSetting(db, "ad_cooldown_seconds", "30"));
  const dailyCap = Number(getSetting(db, "daily_ad_cap", "200"));

  const now = Date.now();
  const canByCooldown = !u.last_ad_at || (now - u.last_ad_at) >= cooldown * 1000;
  const canByCap = u.ads_today < dailyCap;
  const canWatchAd = canByCooldown && canByCap && !u.is_frozen;

  return {
    statusCode: 200,
    body: JSON.stringify({
      telegramId: u.telegram_id,
      firstName: u.first_name,
      username: u.username,
      balance: u.balance_available,
      pending: u.balance_pending,
      totalEarned: u.total_earned,
      adsLeftToday: Math.max(0, dailyCap - u.ads_today),
      rewardPerAd,
      canWatchAd,
      cooldownSeconds: cooldown,
      isFrozen: !!u.is_frozen
    })
  };
};
