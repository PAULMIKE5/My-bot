import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Withdrawals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin_withdrawals", status, q],
    queryFn: () => api(`/admin/withdrawals?status=${status}&q=${encodeURIComponent(q)}`)
  });

  const approve = useMutation({
    mutationFn: (id) => api(`/admin/withdrawals/${id}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_withdrawals"] })
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }) => api(`/admin/withdrawals/${id}/reject`, { method: "POST", body: { reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_withdrawals"] })
  });

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Withdrawals</h3>

      <div style={{ display: "flex", gap: 10, margin: "12px 0", flexWrap: "wrap" }}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input placeholder="Search Telegram ID / method / address" value={q} onChange={(e)=>setQ(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th align="left">User</th>
              <th align="left">Amount</th>
              <th align="left">Method</th>
              <th align="left">Address</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{w.userTelegramId}</td>
                <td><b>{w.amount}</b></td>
                <td>{w.method}</td>
                <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>{w.address}</td>
                <td>{w.status}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {w.status === "pending" && (
                    <>
                      <button onClick={() => approve.mutate(w.id)} disabled={approve.isPending}>Approve</button>
                      <button
                        onClick={() => {
                          const reason = prompt("Reject reason:");
                          if (reason) reject.mutate({ id: w.id, reason });
                        }}
                        disabled={reject.isPending}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => alert(JSON.stringify(w, null, 2))}>View</button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="6" style={{ padding: 16, opacity: .7 }}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
