import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tg } from "../lib/tg";
import { api } from "../lib/api";
import { setUserToken } from "../lib/authStore";

export default function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const t = tg();
      const initData = t?.initData || "";
      const r = await api("/auth/telegram", { method: "POST", body: { initData } });
      setUserToken(r.token);
      nav("/home");
    })().catch(() => nav("/help"));
  }, [nav]);

  return (
    <div className="container">
      <div className="card">
        <div className="h1">Loading…</div>
        <div className="muted">Securing session and syncing your wallet.</div>
      </div>
    </div>
  );
}
