import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin_users", q],
    queryFn: () => api(`/admin/users?q=${encodeURIComponent(q)}`)
  });

  const freeze = useMutation({
    mutationFn: ({ tid, freeze }) => api(`/admin/users/${tid}/freeze`, { method: "POST", body: { freeze } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] })
  });

  const adjust = useMutation({
    mutationFn: ({ tid, delta, reason }) => api(`/admin/users/${tid}/adjust`, { method: "POST", body: { delta, reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] })
  });

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Users</h3>

      <div style={{ display: "flex", gap: 10, margin: "12px 0", flexWrap: "wrap" }}>
        <input
          placeholder="Search Telegram ID / username / name"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th align="left">Telegram ID</th>
              <th align="left">Name</th>
              <th align="left">Username</th>
              <th align="left">Available</th>
              <th align="left">Pending</th>
              <th align="left">Frozen</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.telegram_id} style={{ borderTop: "1px solid #eee" }}>
                <td>{u.telegram_id}</td>
                <td>{u.first_name || "—"}</td>
                <td>{u.username ? "@" + u.username : "—"}</td>
                <td><b>{u.balance_available}</b></td>
                <td>{u.balance_pending}</td>
                <td>{u.is_frozen ? "Yes" : "No"}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => {
                    const deltaStr = prompt("Balance change (use + or -), e.g. 500 or -200:");
                    if (!deltaStr) return;
                    const delta = Number(deltaStr);
                    if (!Number.isFinite(delta) || delta === 0) return alert("Invalid number");
                    const reason = prompt("Reason (optional):") || "";
                    adjust.mutate({ tid: u.telegram_id, delta, reason });
                  }} disabled={adjust.isPending}>
                    Adjust balance
                  </button>

                  <button onClick={() => freeze.mutate({ tid: u.telegram_id, freeze: !u.is_frozen })} disabled={freeze.isPending}>
                    {u.is_frozen ? "Unfreeze" : "Freeze"}
                  </button>

                  <button onClick={() => alert(JSON.stringify(u, null, 2))}>View</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="7" style={{ padding: 16, opacity: .7 }}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ opacity: .75, marginTop: 12 }}>
        Adjust balance supports both adding and removing coins. Negative adjustments cannot make available balance go below 0.
      </p>
    </div>
  );
}
