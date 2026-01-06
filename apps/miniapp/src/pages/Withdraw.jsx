import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Withdraw() {
  const { data } = useQuery({ queryKey: ["withdrawMeta"], queryFn: () => api("/withdraw/meta") });

  const [method, setMethod] = useState("usdt");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  const submit = useMutation({
    mutationFn: () => api("/withdraw", { method: "POST", body: { method, amount: Number(amount), address } }),
    onSuccess: () => alert("Withdrawal request submitted ✅"),
    onError: (e) => alert(String(e.message || e))
  });

  const min = data?.minWithdraw ?? 1000;

  return (
    <>
      <div className="card">
        <div className="h1">Withdraw</div>
        <div className="muted">
          Minimum: <b>{min}</b> coins • Processing: {data?.processingTime ?? "24–72h"}
        </div>
      </div>

      <div className="card mt16">
        <div className="h2">Method</div>
        <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="usdt">USDT (TRC20)</option>
          <option value="paypal">PayPal</option>
          <option value="giftcard">Gift Card</option>
        </select>

        <div className="h2 mt16">Amount</div>
        <input
          className="input"
          inputMode="numeric"
          placeholder={`Min ${min}`}
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
        />

        <div className="h2 mt16">{method === "paypal" ? "PayPal Email" : "Address / Details"}</div>
        <input
          className="input"
          placeholder={method === "paypal" ? "name@example.com" : "Wallet address / code"}
          value={address}
          onChange={(e)=>setAddress(e.target.value)}
        />

        <button
          className="btn btnPrimary mt16"
          disabled={submit.isPending || Number(amount) < min || !address}
          onClick={() => submit.mutate()}
        >
          Submit Withdrawal
        </button>

        <a href="/history" className="btn btnGhost mt12">View History</a>
      </div>

      <div className="card mt16">
        <div className="h2">Rules</div>
        <div className="muted">
          • Only verified rewards are withdrawable.<br/>
          • One pending withdrawal at a time (recommended).<br/>
          • Fraud/multi-accounts can lead to rejection.
        </div>
      </div>
    </>
  );
}
