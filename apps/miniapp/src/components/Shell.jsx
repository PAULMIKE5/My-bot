import { Outlet, NavLink } from "react-router-dom";

export default function Shell() {
  return (
    <>
      <div className="container">
        <Outlet />
      </div>

      <div className="nav">
        <div className="navInner">
          <Nav icon="🏠" to="/home" label="Home" />
          <Nav icon="🎥" to="/earn" label="Earn" />
          <Nav icon="💼" to="/wallet" label="Wallet" />
          <Nav icon="🧾" to="/history" label="History" />
          <Nav icon="👤" to="/profile" label="Profile" />
        </div>
      </div>
    </>
  );
}

function Nav({ to, label, icon }) {
  return (
    <NavLink to={to} className={({isActive}) => `navItem ${isActive ? "active" : ""}`}>
      <div style={{fontSize: 18}}>{icon}</div>
      <div>{label}</div>
    </NavLink>
  );
}
