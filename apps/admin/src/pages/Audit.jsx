import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

export default function Audit() {
  const { data } = useQuery({ queryKey: ["audit"], queryFn: () => api("/admin/audit") });

  const rows = data?.items ?? [];

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Audit Logs</h3>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th align="left">Time</th>
              <th align="left">Admin</th>
              <th align="left">Action</th>
              <th align="left">Target</th>
              <th align="left">Meta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{fmt(a.created_at)}</td>
                <td>{a.username}</td>
                <td><b>{a.action}</b></td>
                <td>{a.target_type}:{a.target_id}</td>
                <td style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis" }}>{a.meta_json || "—"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="5" style={{ padding: 16, opacity: .7 }}>No logs</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
