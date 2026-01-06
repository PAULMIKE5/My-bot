export default function Help() {
  return (
    <>
      <div className="card">
        <div className="h1">Help</div>
        <div className="muted">
          Add your support contact here (Telegram username, email, or form).
        </div>
      </div>

      <div className="card mt16">
        <div className="h2">FAQ</div>
        <div className="muted">
          <b>Why is my reward not instant?</b><br/>
          Rewards are credited after verification to prevent fraud.<br/><br/>

          <b>When do withdrawals arrive?</b><br/>
          Usually within 24–72 hours (can be longer during checks).<br/><br/>

          <b>Can my withdrawal be rejected?</b><br/>
          Yes — suspicious activity, wrong address, or policy violations.
        </div>
      </div>

      <a className="btn btnGhost mt16" href="/home">Back to Home</a>
    </>
  );
}
