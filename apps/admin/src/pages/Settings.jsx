import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Settings() {
  const { data, refetch } = useQuery({ queryKey: ["settings"], queryFn: () => api("/admin/settings") });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data) setForm({
      reward_per_ad: Number(data.reward_per_ad ?? 10),
      min_withdraw: Number(data.min_withdraw ?? 1000),
      ad_cooldown_seconds: Number(data.ad_cooldown_seconds ?? 30),
      daily_ad_cap: Number(data.daily_ad_cap ?? 200),
      one_withdrawal_at_a_time: (data.one_withdrawal_at_a_time ?? "true") === "true",
      processing_time: String(data.processing_time ?? "24–72h"),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => api("/admin/settings", { method: "POST", body: {
      ...form,
      one_withdrawal_at_a_time: form.one_withdrawal_at_a_time ? "true" : "false"
    }}),
    onSuccess: async () => { alert("Saved ✅"); await refetch(); }
  });

  if (!form) return <div>Loading…</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h3 style={{ marginTop: 0 }}>Settings</h3>

      <div style={{ display: "grid", gap: 10, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <Label label="Reward per ad (coins)">
          <input value={form.reward_per_ad} onChange={(e)=>setForm({ ...form, reward_per_ad: Number(e.target.value) })} />
        </Label>

        <Label label="Minimum withdrawal (coins)">
          <input value={form.min_withdraw} onChange={(e)=>setForm({ ...form, min_withdraw: Number(e.target.value) })} />
        </Label>

        <Label label="Ad cooldown (seconds)">
          <input value={form.ad_cooldown_seconds} onChange={(e)=>setForm({ ...form, ad_cooldown_seconds: Number(e.target.value) })} />
        </Label>

        <Label label="Daily ad cap">
          <input value={form.daily_ad_cap} onChange={(e)=>setForm({ ...form, daily_ad_cap: Number(e.target.value) })} />
        </Label>

        <Label label="Processing time text">
          <input value={form.processing_time} onChange={(e)=>setForm({ ...form, processing_time: e.target.value })} />
        </Label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.one_withdrawal_at_a_time}
            onChange={(e)=>setForm({ ...form, one_withdrawal_at_a_time: e.target.checked })}
          />
          One withdrawal at a time
        </label>

        <button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </button>

        <p style={{ opacity: .75, margin: 0 }}>
          Defaults are already set to: <b>10 coins/ad</b> and <b>1000 min withdrawal</b>.
        </p>
      </div>
    </div>
  );
}

function Label({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 800, opacity: .8 }}>{label}</div>
      {children}
    </label>
  );
}
