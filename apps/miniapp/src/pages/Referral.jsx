import { useState } from "react";
import { api } from "../lib/api";
import { getUserToken } from "../lib/authStore";

export default function Referral() {
  const [referralLink, setReferralLink] = useState("");
  const userToken = getUserToken();

  const generateReferralLink = async () => {
    const { telegramId } = await api("/me");
    setReferralLink(`https://your-minapp-url.com?ref=${telegramId}`);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="h1">Referral Program</div>
        <div className="muted">
          Share this link with friends to earn coins. Both you and your referee earn rewards after their first ad view.
        </div>
        <button className="btn btnPrimary mt12" onClick={generateReferralLink}>Generate Link</button>
        {referralLink && (
          <div className="mt16">
            <div className="muted">Share this link:</div>
            <input className="input" value={referralLink} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}
