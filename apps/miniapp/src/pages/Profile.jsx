import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { clearUserToken } from "../lib/authStore";
import { tg } from "../lib/tg";

export default function Profile() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api("/me") });

  return (
    <>
      <div className="card">
        <div className="h1">Profile</div>
        <div className="muted">Your Telegram account details (limited).</div>

        <div className="mt16">
          <div className="spread"><div>Telegram ID</div><b>{data?.telegramId ?? "—"}</b></div>
          <div className="spread mt12"><div>Name</div><b>{data?.firstName ?? "—"}</b></div>
          <div className="spread mt12"><div>Username</div><b>@{data?.username ?? "—"}</b></div>
        </div>

        <a className="btn btnGhost mt16" href="/help">Help / Support</a>
        <a className="btn btnGhost mt12" href="/terms">Terms / Anti-fraud</a>

        <button className="btn btnPrimary mt16" onClick={() => {
          clearUserToken();
          try { tg()?.close(); } catch {}
        }}>
          Close App
        </button>
      </div>
    </>
  );
}
