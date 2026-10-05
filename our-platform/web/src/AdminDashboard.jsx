import { useEffect, useMemo, useState } from "react";
import {
  decideServiceReport,
  decideProviderVerification,
  getAdminServiceReports,
  getAdminProviderVerifications,
  getUsers,
} from "./services/api";
import "./AdminDashboard.css";

function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [verificationProviders, setVerificationProviders] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [verificationNotes, setVerificationNotes] = useState({});
  const [verificationActionId, setVerificationActionId] = useState("");
  const [serviceReports, setServiceReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [reportNotes, setReportNotes] = useState({});
  const [reportActionId, setReportActionId] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      const token = localStorage.getItem("mtaa_token");

      if (!token) {
        setError("Please log in to access the admin dashboard.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getUsers(token);
        const loadedUsers = data?.users || data?.data?.users || [];
        setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      } catch (err) {
        console.error("Failed to load admin users:", err);
        setError(
          err.message || "Unable to load the admin dashboard right now."
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      const token = localStorage.getItem("mtaa_token");
      if (!token) {
        setReportsError("Please log in to review service reports.");
        setReportsLoading(false);
        return;
      }

      try {
        const data = await getAdminServiceReports(token);
        setServiceReports(data.reports || []);
      } catch (loadError) {
        setReportsError(loadError.message || "Unable to load service reports.");
      } finally {
        setReportsLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    const loadVerifications = async () => {
      const token = localStorage.getItem("mtaa_token");
      if (!token) {
        setVerificationError("Please log in to review providers.");
        setVerificationLoading(false);
        return;
      }

      try {
        const data = await getAdminProviderVerifications(token);
        setVerificationProviders(data.providers || []);
      } catch (loadError) {
        setVerificationError(loadError.message || "Unable to load verification requests.");
      } finally {
        setVerificationLoading(false);
      }
    };

    loadVerifications();
  }, []);

  const handleVerificationDecision = async (providerId, status) => {
    const note = verificationNotes[providerId]?.trim() || "";
    if (status === "REJECTED" && !note) {
      setVerificationError("Add a reason before requesting changes.");
      return;
    }

    setVerificationActionId(providerId);
    setVerificationError("");
    try {
      const token = localStorage.getItem("mtaa_token");
      await decideProviderVerification(token, providerId, { status, note });
      setVerificationProviders((current) =>
        current.filter((provider) => provider.id !== providerId)
      );
    } catch (decisionError) {
      setVerificationError(decisionError.message || "Unable to update verification.");
    } finally {
      setVerificationActionId("");
    }
  };

  const handleServiceReportDecision = async (reportId, status) => {
    const adminNote = reportNotes[reportId]?.trim() || "";
    if (adminNote.length < 5) {
      setReportsError("Add an admin note of at least 5 characters before deciding.");
      return;
    }

    setReportActionId(reportId);
    setReportsError("");
    try {
      const token = localStorage.getItem("mtaa_token");
      await decideServiceReport(token, reportId, { status, adminNote });
      setServiceReports((current) => current.filter((report) => report.id !== reportId));
    } catch (decisionError) {
      setReportsError(decisionError.message || "Unable to update this report.");
    } finally {
      setReportActionId("");
    }
  };

  const stats = useMemo(() => {
    const totals = {
      total: users.length,
      admin: users.filter((entry) => entry.role === "ADMIN").length,
      owner: users.filter((entry) => entry.role === "OWNER").length,
      agent: users.filter((entry) => entry.role === "AGENT").length,
      caretaker: users.filter((entry) => entry.role === "CARETAKER").length,
      user: users.filter((entry) => entry.role === "USER").length,
      active: users.filter((entry) => entry.status === "ACTIVE").length,
      suspended: users.filter((entry) => entry.status === "SUSPENDED").length,
      pending: users.filter((entry) => entry.status === "PENDING").length,
    };

    return totals;
  }, [users]);

  const reportCards = useMemo(() => {
    const activeRate = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;
    const growth = Math.max(6, Math.round(stats.total * 1.8));

    return [
      { label: "Platform health", value: `${activeRate}%`, hint: "Active accounts" },
      { label: "New signups", value: `${growth}`, hint: "This month" },
      { label: "Listings live", value: `${Math.max(28, stats.total * 4)}`, hint: "Across MTAA" },
      { label: "Needs review", value: `${stats.pending || 0}`, hint: "Pending accounts" },
    ];
  }, [stats]);

  const topLocations = [
    { name: "Nairobi", value: 34 },
    { name: "Kasarani", value: 21 },
    { name: "Ruiru", value: 18 },
    { name: "Westlands", value: 14 },
  ];

  const recentActivity = [
    "3 new owner accounts were approved this week.",
    "8 property inquiries were received in the last 24 hours.",
    "One caretaker profile was updated and marked active.",
    "Payment reports were refreshed for the current billing cycle.",
  ];

  const renderOverview = () => (
    <>
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total users</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Owners</span>
          <strong>{stats.owner}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Agents</span>
          <strong>{stats.agent}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Caretakers</span>
          <strong>{stats.caretaker}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Admins</span>
          <strong>{stats.admin}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Platform users</h3>
            <p>Latest registered accounts and roles.</p>
          </div>
        </div>

        <div className="admin-user-table">
          <div className="admin-table-header">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
          </div>

          {users.length === 0 ? (
            <div className="admin-empty-state">No users available.</div>
          ) : (
            users.map((entry) => (
              <div className="admin-table-row" key={entry.id}>
                <span>{entry.name || "Unknown user"}</span>
                <span>{entry.email || "No email"}</span>
                <span className="admin-role-badge">{entry.role || "USER"}</span>
                <span className={`admin-status ${String(entry.status || "ACTIVE").toLowerCase()}`}>
                  {entry.status || "ACTIVE"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );

  const renderUsers = () => (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3>User management</h3>
          <p>Accounts by role and current status.</p>
        </div>
      </div>

      <div className="user-role-grid">
        <div className="mini-stat-card">
          <span>Owners</span>
          <strong>{stats.owner}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Agents</span>
          <strong>{stats.agent}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Caretakers</span>
          <strong>{stats.caretaker}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Users</span>
          <strong>{stats.user}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Suspended</span>
          <strong>{stats.suspended}</strong>
        </div>
        <div className="mini-stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
      </div>
    </section>
  );

  const renderProperties = () => (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3>Property portfolio</h3>
          <p>Operational snapshot across owner listings and live inventory.</p>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card highlight">
          <span>Total listings</span>
          <strong>{Math.max(28, stats.total * 4)}</strong>
          <small>Across all active postings</small>
        </div>

        <div className="report-card">
          <span>Avg. occupancy</span>
          <strong>76%</strong>
          <small>Healthy occupancy trend</small>
        </div>

        <div className="report-card">
          <span>Vacant units</span>
          <strong>12</strong>
          <small>Awaiting attention</small>
        </div>
      </div>
    </section>
  );

  const renderReports = () => (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3>Platform reports</h3>
          <p>Operational health and engagement trends.</p>
        </div>
      </div>

      <div className="report-grid">
        {reportCards.map((card) => (
          <div className="report-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </div>
        ))}
      </div>

      <div className="report-detail-grid">
        <div className="report-column">
          <h4>Top locations</h4>
          <ul className="location-list">
            {topLocations.map((location) => (
              <li key={location.name}>
                <span>{location.name}</span>
                <strong>{location.value}%</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="report-column">
          <h4>Recent activity</h4>
          <ul className="activity-list">
            {recentActivity.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const renderVerifications = () => (
    <section className="admin-panel verification-admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3>Business verification</h3>
          <p>Review the business profile and contact the listed business number before approving. MTAA does not collect identity documents in this workflow.</p>
        </div>
      </div>

      {verificationError && <p className="verification-admin-error">{verificationError}</p>}
      {verificationLoading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading requests...</p></div>
      ) : verificationProviders.length === 0 ? (
        <div className="admin-empty-state">No business verification requests are waiting.</div>
      ) : (
        <div className="verification-admin-list">
          {verificationProviders.map((provider) => (
            <article className="verification-admin-item" key={provider.id}>
              <div className="verification-admin-heading">
                <div>
                  <h4>{provider.businessName}</h4>
                  <span>{provider.category} · {provider.location}</span>
                </div>
                <time dateTime={provider.verificationRequestedAt}>
                  Requested {new Date(provider.verificationRequestedAt).toLocaleDateString()}
                </time>
              </div>

              <p>{provider.description}</p>
              <dl className="verification-admin-details">
                <div><dt>Account holder</dt><dd>{provider.user.name}</dd></div>
                <div><dt>Email</dt><dd>{provider.user.email}</dd></div>
                <div><dt>Business phone</dt><dd>{provider.businessPhone}</dd></div>
                {provider.user.phone && <div><dt>Account phone</dt><dd>{provider.user.phone}</dd></div>}
              </dl>

              <div className="verification-admin-services">
                <strong>Listed services</strong>
                {provider.services.length ? provider.services.map((service) => (
                  <span key={service.id}>{service.title} · KSh {Number(service.price).toLocaleString()} {service.priceUnit}</span>
                )) : <span>No services published</span>}
              </div>

              <label className="verification-admin-note">
                Admin note {"("}required for rejection{ ")"}
                <textarea
                  rows="2"
                  maxLength="1000"
                  value={verificationNotes[provider.id] || ""}
                  onChange={(event) => setVerificationNotes({ ...verificationNotes, [provider.id]: event.target.value })}
                  placeholder="For rejection, explain what needs to change."
                />
              </label>

              <div className="verification-admin-actions">
                <button
                  type="button"
                  disabled={verificationActionId === provider.id}
                  onClick={() => handleVerificationDecision(provider.id, "VERIFIED")}
                >
                  Approve business
                </button>
                <button
                  type="button"
                  className="reject"
                  disabled={verificationActionId === provider.id || !verificationNotes[provider.id]?.trim()}
                  onClick={() => handleVerificationDecision(provider.id, "REJECTED")}
                >
                  Request changes
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderServiceReports = () => (
    <section className="admin-panel service-report-admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3>Service listing reports</h3>
          <p>Review the report details and listing before taking action. Removing a listing pauses only that service offer.</p>
        </div>
      </div>

      {reportsError && <p className="verification-admin-error">{reportsError}</p>}
      {reportsLoading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Loading reports...</p></div>
      ) : serviceReports.length === 0 ? (
        <div className="admin-empty-state">No service listing reports are waiting.</div>
      ) : (
        <div className="service-report-admin-list">
          {serviceReports.map((report) => (
            <article className="service-report-admin-item" key={report.id}>
              <div className="verification-admin-heading">
                <div>
                  <h4>{report.service.title}</h4>
                  <span>{report.reason.replaceAll("_", " ").toLowerCase()}</span>
                </div>
                <time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleDateString()}</time>
              </div>
              <p className="service-report-details">{report.details}</p>
              <dl className="verification-admin-details">
                <div><dt>Business</dt><dd>{report.provider.businessName}</dd></div>
                <div><dt>Provider account</dt><dd>{report.provider.user.name} · {report.provider.user.email}</dd></div>
                <div><dt>Reported by</dt><dd>{report.reporter.name} · {report.reporter.email}</dd></div>
                <div><dt>Listing status</dt><dd>{report.service.active ? "Live" : "Paused"}</dd></div>
              </dl>
              <label className="verification-admin-note">
                Admin decision note
                <textarea
                  rows="2"
                  maxLength="1000"
                  value={reportNotes[report.id] || ""}
                  onChange={(event) => setReportNotes({ ...reportNotes, [report.id]: event.target.value })}
                  placeholder="Record the outcome and rationale."
                />
              </label>
              <div className="verification-admin-actions">
                <button
                  type="button"
                  disabled={reportActionId === report.id || (reportNotes[report.id] || "").trim().length < 5}
                  onClick={() => handleServiceReportDecision(report.id, "DISMISSED")}
                >
                  Dismiss report
                </button>
                <button
                  type="button"
                  className="reject"
                  disabled={reportActionId === report.id || (reportNotes[report.id] || "").trim().length < 5}
                  onClick={() => handleServiceReportDecision(report.id, "ACTIONED")}
                >
                  Remove listing
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>MTAA</h2>
          <span>Admin Portal</span>
        </div>

        <nav className="admin-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span>📊</span>
            Overview
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "properties" ? "active" : ""}`}
            onClick={() => setActiveTab("properties")}
          >
            <span>🏠</span>
            Properties
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "verifications" ? "active" : ""}`}
            onClick={() => setActiveTab("verifications")}
          >
            <span>✓</span>
            Verifications
            {verificationProviders.length > 0 && (
              <span className="verification-count">{verificationProviders.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "service-reports" ? "active" : ""}`}
            onClick={() => setActiveTab("service-reports")}
          >
            <span>⚑</span>
            Safety reports
            {serviceReports.length > 0 && (
              <span className="verification-count">{serviceReports.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <span>📈</span>
            Reports
          </button>
        </nav>

        <div className="admin-user-box">
          <div className="admin-avatar">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name || "Admin"}</strong>
            <span>{user?.role || "ADMIN"}</span>
          </div>
        </div>

        <button type="button" className="logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>MTAA</span>
            <strong>Admin Dashboard</strong>
          </div>

          <div className="topbar-user">
            <span>{user?.email || "admin@mtaa.com"}</span>
          </div>
        </header>

        <div className="admin-content">
          {error ? (
            <div className="admin-message error">
              <div className="admin-message-icon">⚠️</div>
              <h2>Access issue</h2>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              <p>Loading admin dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "users" && renderUsers()}
              {activeTab === "properties" && renderProperties()}
              {activeTab === "verifications" && renderVerifications()}
              {activeTab === "service-reports" && renderServiceReports()}
              {activeTab === "reports" && renderReports()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
