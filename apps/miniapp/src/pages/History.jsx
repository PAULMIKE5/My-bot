import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

export default function History() {
  const { data } = useQuery({ queryKey: ["history"], queryFn: () => api("/history") });

  return (
    <>
      <div className="card">
        <div className="h1">History</div>
        <div className="muted">All credits and withdrawals.</div>
      </div>

      <div className="card mt16">
        <div className="h2">Earnings</div>
        {(data?.earns || []).slice(0, 30).map((e, idx) => (
          <div key={idx} className="spread" style={{padding: "10px 0", borderTop: idx ? "1px solid rgba(255,255,255,.10)" : "0"}}>
            <div>
              <b>{e.type}</b> <span className="muted">({e.status})</span>
              <div className="muted">{fmt(e.created_at)}</div>
            </div>
            <b>+{e.amount}</b>
          </div>
        ))}
        {(!data?.earns || data.earns.length === 0) && <div className="muted mt12">No earnings yet.</div>}
      </div>

      <div className="card mt16">
        <div className="h2">Withdrawals</div>
        {(data?.withdrawals || []).slice(0, 30).map((w, idx) => (
          <div key={idx} style={{padding: "10px 0", borderTop: idx ? "1px solid rgba(255,255,255,.10)" : "0"}}>
            <div className="spread">
              <div>
                <b>{w.method}</b> <span className="muted">({w.status})</span>
                <div className="muted">{fmt(w.created_at)}</div>
                {w.reject_reason ? <div className="muted">Reason: {w.reject_reason}</div> : null}
              </div>
              <b>-{w.amount}</b>
            </div>
          </div>
        ))}
        {(!data?.withdrawals || data.withdrawals.length === 0) && <div className="muted mt12">No withdrawals yet.</div>}
      </div>
    </>
  );
}
