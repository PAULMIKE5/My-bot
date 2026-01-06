const { verifyInitData } = require("./telegramVerify.js");
const { signUserJwt } = require("./auth.js");
const { openDb } = require("./db.js");

module.exports.handler = async function(event) {
  const db = openDb();
  const { initData } = JSON.parse(event.body);
  const botToken = process.env.BOT_TOKEN;

  const v = verifyInitData(initData, botToken);
  if (!v.ok) return { statusCode: 401, body: v.error };

  const tUser = v.user;
  if (!tUser?.id) return { statusCode: 400, body: "Missing Telegram user" };

  const existing = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(String(tUser.id));
  if (!existing) {
    db.prepare(`
      INSERT INTO users(telegram_id, first_name, username, created_at)
      VALUES(?,?,?,?,?)
    `).run(String(tUser.id), tUser.first_name || null, tUser.username || null, Date.now());
  } else {
    db.prepare("UPDATE users SET first_name=?, username=? WHERE telegram_id=?")
      .run(tUser.first_name || existing.first_name, tUser.username || existing.username, String(tUser.id));
  }

  const token = signUserJwt({ type: "user", telegram_id: String(tUser.id) }, process.env.JWT_SECRET);
  return {
    statusCode: 200,
    body: JSON.stringify({ token, telegram_id: String(tUser.id) })
  };
};
