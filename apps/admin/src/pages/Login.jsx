import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminToken } from "../lib/authStore";
import { api } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("change-me-now");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await api("/admin/login", { method: "POST", body: { username, password } });
      setAdminToken(r.token);
      nav("/dashboard");
    } catch (e) {
      alert(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 18 }}>
      <h2>Admin Login</h2>
      <div style={{ display: "grid", gap: 10 }}>
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" />
        <button onClick={submit} disabled={loading}>{loading ? "..." : "Login"}</button>
        <p style={{ opacity: .75 }}>
          Change admin credentials in <code>server/.env</code> before production.
        </p>
      </div>
    </div>
  );
}
