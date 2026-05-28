import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      navigate("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0c11",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "400px",
        background: "radial-gradient(ellipse, rgba(0,229,195,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "380px",
        animation: "fadeUp 0.35s ease both",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}>
            <span style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "#00e5c3",
              boxShadow: "0 0 12px rgba(0,229,195,0.6)",
              display: "inline-block",
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              color: "#e8ecf4",
              letterSpacing: "-0.02em",
            }}>EventSys</span>
          </div>
          <p style={{ color: "#4a5168", fontSize: "13px" }}>Sign in to your account</p>
        </div>

        <div style={{
          background: "#1c2130",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(255,77,106,0.1)",
              color: "#ff6b83",
              fontSize: "13px",
              fontWeight: 500,
              borderLeft: "3px solid #ff4d6a",
              marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4a5168",
                fontFamily: "'Syne', sans-serif",
              }}>Username</label>
              <input
                type="text"
                name="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#10131a",
                  color: "#e8ecf4",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#00e5c3";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,229,195,0.1)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4a5168",
                fontFamily: "'Syne', sans-serif",
              }}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#10131a",
                  color: "#e8ecf4",
                  fontSize: "14px",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#00e5c3";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,229,195,0.1)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "6px",
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "rgba(0,229,195,0.5)" : "#00e5c3",
                color: "#061a17",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.02em",
              }}
              onMouseOver={e => { if (!loading) e.target.style.background = "#00f5d4"; }}
              onMouseOut={e => { if (!loading) e.target.style.background = "#00e5c3"; }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#4a5168" }}>
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                color: "#00e5c3",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                padding: 0,
              }}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}