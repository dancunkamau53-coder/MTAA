import { useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./services/api";

function Notifications({ user, onBack, onOpenProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("mtaa_token");

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const data = await getNotifications(token);
        if (active) {
          setNotifications(data.notifications || []);
        }
      } catch {
        if (active) {
          setError("Unable to load notifications. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [token]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true }))
      );
      setError("");
    } catch {
      setError("Unable to update notifications. Please try again.");
    }
  };

  const markOneAsRead = async (id) => {
    const notification = notifications.find((item) => item.id === id);
    if (!notification || notification.read) {
      return;
    }

    try {
      await markNotificationRead(token, id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item
        )
      );
      setError("");
    } catch {
      setError("Unable to update this notification. Please try again.");
    }
  };

  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="notifications-page">
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
          <h1>Notifications</h1>
        </div>
      </header>

      <main className="notifications-content">
        <section className="notifications-topbar">
          <div>
            <h2>Updates for {user?.name || "your account"}</h2>
            <p>
              {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            className="profile-primary-button"
            onClick={markAllRead}
            disabled={unreadCount === 0 || loading}
          >
            Mark all as read
          </button>
        </section>

        <section className="notifications-list">
          {loading && <p className="notification-state">Loading notifications...</p>}
          {error && <p className="notification-state error">{error}</p>}
          {!loading && !error && notifications.length === 0 && (
            <p className="notification-state">You’re all caught up. New activity on your properties will appear here.</p>
          )}
          {!loading && notifications.map((item) => (
            <article
              key={item.id}
              className={`notification-card ${item.read ? "read" : "unread"}`}
              onClick={() => markOneAsRead(item.id)}
            >
              <div className="notification-icon">
                {item.type === "inquiry" && "💬"}
                {item.type === "saved" && "💾"}
                {item.type === "like" && "♥"}
                {item.type === "service-request" && "🛠️"}
                {item.type === "service-review" && "★"}
                {item.type === "service-verification" && "✓"}
                {item.type === "service-message" && "✉"}
              </div>

              <div className="notification-body">
                <div className="notification-headline">
                  <strong>{item.title}</strong>
                  {!item.read && <span className="notification-dot" />}
                </div>

                <p>{item.detail}</p>
                <small>{formatTime(item.createdAt)}</small>
              </div>
            </article>
          ))}
        </section>

        <button
          type="button"
          className="profile-secondary-button"
          onClick={() => {
            if (onOpenProfile) {
              onOpenProfile();
            }
          }}
        >
          View profile
        </button>
      </main>
    </div>
  );
}

export default Notifications;
