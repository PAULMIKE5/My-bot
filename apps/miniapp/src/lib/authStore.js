const KEY = "miniapp_user_token";

export function setUserToken(token) {
  localStorage.setItem(KEY, token);
}

export function getUserToken() {
  return localStorage.getItem(KEY) || "";
}

export function clearUserToken() {
  localStorage.removeItem(KEY);
}
