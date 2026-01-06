import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Earn() {
  const { data: me, refetch } = useQuery({ queryKey: ["me"], queryFn: () => api("/me") });

  const startAd = useMutation({
    mutationFn: () => api("/earn/start", { method: "POST" }),
    onSuccess: (d) => {
      window.location.href = d.redirectUrl;
    },
    onError: async (e) => {
      alert(String(e.message || e));
      await refetch();
    }
  });

  return (
    <>
      <div className="card">
        <div className="h1">Earn Coins</div>
        <div className="muted">Rewards are credited after server verification.</div>
      </div>

      <div className="card mt16">
        <div className="spread">
          <div>
            <div className="h2">🎥 Watch Ad</div>
            <div className="muted">+{me?.rewardPerAd ?? 10} coins • cooldown applies</div>
          </div>
          <span className={`badge ${me?.canWatchAd ? "ok" : "warn"}`}>
            {me?.canWatchAd ? "Ready" : "Wait"}
          </span>
        </div>

        <button
          className="btn btnPrimary mt12"
          disabled={!me?.canWatchAd || startAd.isPending}
          onClick={() => startAd.mutate()}
        >
          ▶ Watch (Demo)
        </button>

        <div className="muted mt12">
          This demo opens a 15s test “ad page”. Replace with a real provider flow for production.
        </div>
      </div>

      <div className="card mt16">
        <div className="h2">🧩 Offerwall</div>
        <div className="muted">Optional: integrate CPX/AdGate/OGAds etc. via backend.</div>
        <button className="btn btnGhost mt12" onClick={() => alert("Implement offerwall provider + callback in backend")}>
          Open Offerwall (placeholder)
        </button>
      </div>
    </>
  );
}
