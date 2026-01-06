import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { initTelegram, tg } from "./lib/tg";

import Shell from "./components/Shell.jsx";
import Splash from "./pages/Splash.jsx";
import Home from "./pages/Home.jsx";
import Earn from "./pages/Earn.jsx";
import Wallet from "./pages/Wallet.jsx";
import History from "./pages/History.jsx";
import Profile from "./pages/Profile.jsx";
import Withdraw from "./pages/Withdraw.jsx";
import Help from "./pages/Help.jsx";
import Terms from "./pages/Terms.jsx";

export default function App() {
  useEffect(() => {
    const t = initTelegram();
    if (t) t.setHeaderColor?.("secondary_bg_color");
  }, []);

  // Check if we are inside Telegram
  const inTelegram = !!tg();
  if (!inTelegram) {
    return (
      <div className="container">
        <div className="card">
          <div className="h1">Open inside Telegram</div>
          <div className="muted">This is a Telegram Mini App and needs to be opened from your bot.</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route element={<Shell />}>
        <Route path="/home" element={<Home />} />
        <Route path="/earn" element={<Earn />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />
      </Route>
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
