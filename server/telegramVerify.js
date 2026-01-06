import crypto from "crypto";

/**
 * Verifies Telegram Mini App initData (hash check).
 * Reference: Telegram Web Apps "Validating data received via the Web App".
 */
export function verifyInitData(initData, botToken) {
  if (!initData) return { ok: false, error: "Missing initData" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "Missing hash" };
  params.delete("hash");

  // Build data_check_string: key=value lines sorted by key
  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push([k, v]);
  pairs.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { ok: false, error: "Bad hash" };

  // Extract user if present
  const userJson = params.get("user");
  let user = null;
  if (userJson) {
    try { user = JSON.parse(userJson); } catch { user = null; }
  }

  return { ok: true, user, raw: Object.fromEntries(params.entries()) };
}
