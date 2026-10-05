import { useState } from "react";
import { loginUser, registerUser } from "./services/api";
import "./Auth.css";

function Auth({ onLogin, initialMode = "login", initialRole = "USER" }) {
  const [mode, setMode] = useState(initialMode);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let data;

      if (mode === "login") {
        data = await loginUser({
          email: form.email,
          password: form.password,
        });
      } else {
        data = await registerUser(form);
      }

      localStorage.setItem("mtaa_token", data.token);
      localStorage.setItem(
        "mtaa_user",
        JSON.stringify(data.user)
      );

      setSuccess(
        mode === "login"
          ? "Login successful!"
          : "Account created successfully!"
      );

      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          MTAA
        </div>

        <div className="auth-header">
          <p>WELCOME TO MTAA</p>

          <h1>
            {mode === "login"
              ? "Welcome back."
              : "Create your account."}
          </h1>

          <span>
            {mode === "login"
              ? "Sign in to continue to MTAA."
              : "Join MTAA and discover your community."}
          </span>
        </div>

        {error && (
          <div className="auth-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-message success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {mode === "register" && (
            <>
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="07XXXXXXXX"
                value={form.phone}
                onChange={handleChange}
              />

              <label>Account Type</label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="USER">
                  User
                </option>

                <option value="OWNER">
                  Property Owner
                </option>

                <option value="AGENT">
                  Property Agent
                </option>

                <option value="CARETAKER">
                  Caretaker
                </option>

                <option value="SERVICE_PROVIDER">
                  Service Provider
                </option>
              </select>
            </>
          )}

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            minLength="6"
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login to MTAA"
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">
          <span>
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={switchMode}
          >
            {mode === "login"
              ? "Create Account"
              : "Login"}
          </button>
        </div>

        <div className="auth-footer">
          <span>🏠</span>

          <p>
            Find your place. Find your community.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Auth;
