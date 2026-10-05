import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateCurrentUser,
} from "./services/api";
import "./Profile.css";

function Profile({
  user,
  onBack,
  onOpenSavedProperties,
  onOpenMyProperties,
  onOpenPayments,
  onOpenNotifications,
}) {
  const [profileUser, setProfileUser] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("mtaa_token");

      if (!token) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getCurrentUser(token);
        const currentUser =
          data?.user ||
          data?.data?.user ||
          user ||
          null;

        setProfileUser(currentUser);
        setForm({
          name: currentUser?.name || "",
          phone: currentUser?.phone || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError(
          err.message || "Unable to load your profile right now."
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      setProfileUser(user);
      setForm({
        name: user?.name || "",
        phone: user?.phone || "",
      });
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user]);

  const displayUser = profileUser || user || {};

  const handleEditProfile = () => {
    setSubmitError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSubmitError("");
    setIsEditing(false);
    setForm({
      name: displayUser.name || "",
      phone: displayUser.phone || "",
    });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("mtaa_token");

    if (!token) {
      setSubmitError("Please log in again to update your profile.");
      return;
    }

    try {
      setSaving(true);
      setSubmitError("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };

      const data = await updateCurrentUser(token, payload);
      const updatedUser = data?.user || data?.data?.user || {
        ...displayUser,
        name: payload.name,
        phone: payload.phone,
      };

      setProfileUser(updatedUser);
      setIsEditing(false);

      const storedUser = JSON.parse(
        localStorage.getItem("mtaa_user") || "{}"
      );

      const refreshedUser = {
        ...storedUser,
        ...updatedUser,
      };

      localStorage.setItem("mtaa_user", JSON.stringify(refreshedUser));
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSubmitError(
        err.message || "Unable to update your profile right now."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button
          type="button"
          className="profile-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="profile-header-copy">
          <p className="profile-label">MTAA</p>
          <h1>My Profile</h1>
        </div>
      </header>

      <main className="profile-content">
        {loading ? (
          <div className="profile-loading">
            <div className="profile-spinner" />
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="profile-message error">
            <div className="profile-message-icon">⚠️</div>
            <h2>Profile unavailable</h2>
            <p>{error}</p>
            <button
              type="button"
              className="profile-primary-button"
              onClick={onBack}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {!isEditing ? (
              <>
                <section className="profile-hero-card">
                  <div className="profile-avatar">
                    {(displayUser.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="profile-identity">
                    <p className="profile-role">
                      {displayUser.role || "USER"}
                    </p>
                    <h2>{displayUser.name || "User"}</h2>
                    <p>{displayUser.email || "No email available"}</p>
                  </div>

                  <button
                    type="button"
                    className="profile-primary-button"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </button>
                </section>

                <div className="profile-grid">
                  <section className="profile-card">
                    <h3>Account Details</h3>

                    <div className="profile-row">
                      <span>Full Name</span>
                      <strong>{displayUser.name || "Not set"}</strong>
                    </div>

                    <div className="profile-row">
                      <span>Email</span>
                      <strong>{displayUser.email || "Not set"}</strong>
                    </div>

                    <div className="profile-row">
                      <span>Phone</span>
                      <strong>{displayUser.phone || "Not set"}</strong>
                    </div>

                    <div className="profile-row">
                      <span>Role</span>
                      <strong>{displayUser.role || "USER"}</strong>
                    </div>

                    <div className="profile-row">
                      <span>Status</span>
                      <strong>{displayUser.status || "ACTIVE"}</strong>
                    </div>
                  </section>

                  <section className="profile-card">
                    <h3>Quick Actions</h3>

                    <button
                      type="button"
                      className="profile-action-button"
                      onClick={onOpenSavedProperties}
                    >
                      💾 Saved Properties
                    </button>

                    <button
                      type="button"
                      className="profile-action-button"
                      onClick={onOpenMyProperties}
                    >
                      🏠 My Properties
                    </button>

                    <button
                      type="button"
                      className="profile-action-button"
                      onClick={() => {
                        if (onOpenPayments) {
                          onOpenPayments();
                        }
                      }}
                    >
                      💳 Payments
                    </button>

                    <button
                      type="button"
                      className="profile-action-button"
                      onClick={() => {
                        if (onOpenNotifications) {
                          onOpenNotifications();
                        }
                      }}
                    >
                      🔔 Notifications
                    </button>

                    <button
                      type="button"
                      className="profile-action-button secondary"
                      onClick={handleEditProfile}
                    >
                      ✏️ Edit Profile
                    </button>
                  </section>
                </div>
              </>
            ) : (
              <section className="profile-card form-card">
                <h3>Edit Profile</h3>

                <form onSubmit={handleSaveProfile} className="profile-form">
                  <label>
                    Full Name
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFieldChange}
                    />
                  </label>

                  {submitError && (
                    <div className="profile-submit-error">{submitError}</div>
                  )}

                  <div className="profile-form-actions">
                    <button
                      type="button"
                      className="profile-secondary-button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-primary-button"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
