import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Dashboard() {
  const { data: withdrawals } = useQuery({
    queryKey: ["wd_pending_count"],
    queryFn: () => api("/admin/withdrawals?status=pending&q=")
  });

  const { data: users } = useQuery({
    queryKey: ["users_count"],
    queryFn: () => api("/admin/users?q=")
  });

  const pendingCount = withdrawals?.items?.length ?? 0;
  const usersCount = users?.items?.length ?? 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Overview</h3>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Stat label="Users" value={usersCount} />
          <Stat label="Pending withdrawals" value={pendingCount} />
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Next steps</h3>
        <ul>
          <li>Review pending withdrawals</li>
          <li>Adjust settings: min withdraw, reward per ad, cooldown</li>
          <li>Use Users page to add/remove balance and freeze suspicious users</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ opacity: .7, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
