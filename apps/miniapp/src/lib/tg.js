export function tg() {
  return window.Telegram?.WebApp;
}

export function initTelegram() {
  const t = tg();
  if (!t) return null;
  t.ready();
  t.expand();
  return t;
}
