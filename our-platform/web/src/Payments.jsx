import { useState } from "react";

function Payments({ user, onBack, onOpenProfile }) {
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState("");

  const summaryCards = [
    {
      label: "Outstanding",
      value: "KSh 18,500",
      tone: "warning",
    },
    {
      label: "Next payout",
      value: "KSh 42,750",
      tone: "success",
    },
    {
      label: "Account status",
      value: "Verified",
      tone: "neutral",
    },
  ];

  const upcomingCharges = [
    {
      name: "Platform subscription",
      due: "Due in 3 days",
      amount: "KSh 3,200",
    },
    {
      name: "Listing promotion",
      due: "Due in 7 days",
      amount: "KSh 5,500",
    },
  ];

  const transactionHistory = [
    {
      id: "INV-2901",
      type: "Monthly hosting fee",
      date: "2026-10-01",
      amount: "- KSh 3,200",
      status: "Paid",
    },
    {
      id: "INV-2894",
      type: "Featured listing renewal",
      date: "2026-09-27",
      amount: "- KSh 5,500",
      status: "Paid",
    },
    {
      id: "PAYOUT-102",
      type: "Property rent payout",
      date: "2026-09-15",
      amount: "+ KSh 42,750",
      status: "Processed",
    },
  ];

  const handlePayNow = () => {
    setProcessing(true);
    setNotice("Payment request queued successfully.");

    window.setTimeout(() => {
      setProcessing(false);
    }, 800);
  };

  return (
    <div className="payments-page">
      <header className="payments-header">
        <button
          type="button"
          className="profile-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="profile-header-copy">
          <p className="profile-label">MTAA</p>
          <h1>Payments</h1>
        </div>
      </header>

      <main className="payments-content">
        {notice && (
          <div className="payments-banner success">
            ✅ {notice}
          </div>
        )}

        <section className="payments-summary-grid">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`payments-summary-card ${card.tone}`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </section>

        <div className="payments-layout">
          <section className="payments-card payment-method-card">
            <div className="payments-card-header">
              <h3>Payment method</h3>
              <span className="payments-pill">Primary</span>
            </div>

            <div className="payment-visual">
              <div className="chip" />
              <div>
                <p className="payment-brand">MTAA Wallet</p>
                <strong>
                  {user?.name || "Account Holder"}
                </strong>
              </div>
            </div>

            <div className="payment-method-meta">
              <div>
                <span>Card</span>
                <strong>•••• 8441</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>06/29</strong>
              </div>
            </div>

            <button
              type="button"
              className="profile-primary-button"
              onClick={handlePayNow}
              disabled={processing}
            >
              {processing ? "Processing..." : "Pay now"}
            </button>
          </section>

          <section className="payments-card">
            <div className="payments-card-header">
              <h3>Upcoming charges</h3>
              <span className="payments-pill neutral">This month</span>
            </div>

            <ul className="charges-list">
              {upcomingCharges.map((charge) => (
                <li key={charge.name}>
                  <div>
                    <strong>{charge.name}</strong>
                    <span>{charge.due}</span>
                  </div>
                  <strong>{charge.amount}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="payments-card">
          <div className="payments-card-header">
            <h3>Recent transactions</h3>
            <button
              type="button"
              className="text-link-button"
              onClick={() => {
                if (onOpenProfile) {
                  onOpenProfile();
                }
              }}
            >
              Account
            </button>
          </div>

          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{transaction.type}</td>
                    <td>{transaction.date}</td>
                    <td>{transaction.amount}</td>
                    <td>
                      <span
                        className={`status-badge ${transaction.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Payments;
