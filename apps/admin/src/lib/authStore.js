const KEY = "admin_token";

export function setAdminToken(t) { localStorage.setItem(KEY, t); }
export function getAdminToken() { return localStorage.getItem(KEY) || ""; }
export function clearAdminToken() { localStorage.removeItem(KEY); }
