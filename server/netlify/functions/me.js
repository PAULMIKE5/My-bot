const { openDb } = require("./db.js");

module.exports.handler = async function(event) {
  const db = openDb();
  const { telegram_id } = event.queryStringParameters;

  // Fetch the user data based on telegram_id
  const u = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(telegram_id);

  // If the user is not found, return a 404 error
  if (!u) {
    return { statusCode: 404, body: "User not found" };
  }

  // Fetch rewardPerAd and cooldownSeconds from the user or use default values
  const rewardPerAd = u.rewardPerAd || 10; // Default to 10 coins per ad
  const cooldownSeconds = u.cooldownSeconds || 30; // Default cooldown of 30 seconds

  // Calculate if the user can watch an ad
  const canWatchAd = !u.isFrozen && u.adsLeftToday > 0; // Check if not frozen and if ads are left

  return {
    statusCode: 200,
    body: JSON.stringify({
      telegramId: u.telegram_id, // Return the Telegram ID
      firstName: u.first_name || "N/A", // Return first name, default to "N/A" if null
      username: u.username || "N/A", // Return username, default to "N/A" if null
      balance: u.balance_available, // User's available balance
      adsLeftToday: u.adsLeftToday || 0, // Ads left for today, default to 0 if null
      rewardPerAd, // Reward per ad
      canWatchAd, // Whether the user can watch ads
      cooldownSeconds, // Cooldown period in seconds
      isFrozen: !!u.isFrozen, // Convert to boolean (true or false) to avoid null/undefined
    }),
  };
};
