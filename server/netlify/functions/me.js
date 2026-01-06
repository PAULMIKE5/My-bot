const { openDb, getSetting } = require("./db.js");

module.exports.handler = async function(event) {
  const db = openDb();
  const { telegram_id } = event.queryStringParameters;

  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(telegram_id);
  
  if (!u) {
    return { statusCode: 404, body: "User not found" };
  }

  // Fetch rewardPerAd from settings or set default value
  const rewardPerAd = u.rewardPerAd || 10; // Default 10 coins per ad
  const cooldownSeconds = u.cooldownSeconds || 30; // Default cooldown of 30 seconds

  // If the user is frozen, we may need to prevent them from watching ads
  const canWatchAd = !u.isFrozen && u.adsLeftToday < 200; // Example logic: ad cap of 200

  return {
    statusCode: 200,
    body: JSON.stringify({
      telegramId: u.telegram_id,
      firstName: u.first_name,
      username: u.username,
      balance: u.balance_available,
      adsLeftToday: u.adsLeftToday || 0, // Default to 0 if null
      rewardPerAd,
      canWatchAd,
      cooldownSeconds,
      isFrozen: !!u.isFrozen,
    }),
  };
};

