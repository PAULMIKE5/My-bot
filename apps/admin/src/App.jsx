import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { clearAdminToken, getAdminToken } from "./lib/authStore";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Withdrawals from "./pages/Withdrawals.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";
import Audit from "./pages/Audit.jsx";

function Layout({ children }) {
  const nav = useNavigate();
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <button onClick={() => { clearAdminToken(); nav("/login"); }}>Logout</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <Tab to="/dashboard" label="Dashboard" />
        <Tab to="/withdrawals" label="Withdrawals" />
        <Tab to="/users" label="Users" />
        <Tab to="/settings" label="Settings" />
        <Tab to="/audit" label="Audit Logs" />
      </div>

      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: isActive ? "#111" : "#fff",
        color: isActive ? "#fff" : "#111",
        textDecoration: "none",
        fontWeight: 800
      })}
    >
      {label}
    </NavLink>
  );
}

function RequireAuth({ children }) {
  const token = getAdminToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/withdrawals" element={<RequireAuth><Layout><Withdrawals /></Layout></RequireAuth>} />
      <Route path="/users" element={<RequireAuth><Layout><Users /></Layout></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />
      <Route path="/audit" element={<RequireAuth><Layout><Audit /></Layout></RequireAuth>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
