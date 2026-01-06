import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Home() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api("/me") });

  return (
    <>
      <div className="card">
        <div className="spread">
          <div>
            <div className="h1">Your Balance</div>
            <div style={{fontSize: 30, fontWeight: 900}}>
              {data?.balance ?? "—"} <span style={{fontSize: 14, opacity: .7}}>coins</span>
            </div>
            <div className="muted mt12">
              Earn 10 coins per ad. Minimum withdrawal is 1000 coins.
            </div>
          </div>
          <div className={`badge ${data?.isFrozen ? "err" : "ok"}`}>
            {data?.isFrozen ? "Frozen" : "Active"}
          </div>
        </div>
        <hr className="sep"/>
        <div className="muted">
          Ads left today: <b>{data?.adsLeftToday ?? 0}</b><br/>
          Cooldown: <b>{data?.cooldownSeconds ?? 0}s</b>
        </div>
      </div>

      <div className="card mt16">
        <div className="h2">Quick Actions</div>
        <a className="btn btnPrimary mt12" href="/earn">🎥 Start Earning</a>
        <a className="btn btnGhost mt12" href="/withdraw">💸 Withdraw</a>
      </div>

      <div className="card mt16">
        <div className="h2">Tips</div>
        <div className="muted">
          • Always use your real payment address/email.<br/>
          • Fraud or multi-accounting can lead to rejected withdrawals.<br/>
          • Check History to see all credits and withdrawals.
        </div>
      </div>
    </>
  );
}
