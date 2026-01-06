import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Wallet() {
  const { data } = useQuery({ queryKey: ["wallet"], queryFn: () => api("/wallet") });

  return (
    <>
      <div className="card">
        <div className="h1">Wallet</div>
        <div className="muted">Available, pending, and total earnings.</div>

        <div className="mt16">
          <div className="spread"><div>Available</div><b>{data?.available ?? 0}</b></div>
          <div className="spread mt12"><div>Pending</div><b>{data?.pending ?? 0}</b></div>
          <div className="spread mt12"><div>Total Earned</div><b>{data?.totalEarned ?? 0}</b></div>
        </div>

        <a href="/withdraw" className="btn btnPrimary mt16">💸 Withdraw</a>
      </div>
    </>
  );
}
