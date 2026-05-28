import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#10131a",
  color: "#e8ecf4",
  fontSize: "14px",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#4a5168",
  fontFamily: "'Syne', sans-serif",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function parseErrors(data) {
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    return Object.entries(data)
      .map(([field, messages]) => {
        const msgs = Array.isArray(messages) ? messages.join(" ") : messages;
        return `${field}: ${msgs}`;
      })
      .join("\n");
  }
  return "An error occurred. Please try again.";
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => {
        e.target.style.borderColor = "#00e5c3";
        e.target.style.boxShadow = "0 0 0 3px rgba(0,229,195,0.1)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "", email: "", password: "",
    first_name: "", last_name: "",
    age: "", year: "", course: "", sex: "prefer_not",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(formData);
      navigate("/login");
    } catch (err) {
      setError(parseErrors(err.response?.data) || err.message || "Registration failed.");
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
      padding: "24px 20px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "400px",
        background: "radial-gradient(ellipse, rgba(0,229,195,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "420px", animation: "fadeUp 0.35s ease both" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#00e5c3",
              boxShadow: "0 0 10px rgba(0,229,195,0.6)",
              display: "inline-block",
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "19px", fontWeight: 800,
              color: "#e8ecf4", letterSpacing: "-0.02em",
            }}>EventSys</span>
          </div>
          <p style={{ color: "#4a5168", fontSize: "13px" }}>Create your account</p>
        </div>

        <div style={{
          background: "#1c2130",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          {error && (
            <pre style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(255,77,106,0.1)",
              color: "#ff6b83",
              fontSize: "12px",
              fontWeight: 500,
              borderLeft: "3px solid #ff4d6a",
              marginBottom: "20px",
              whiteSpace: "pre-wrap",
              fontFamily: "'DM Sans', sans-serif",
              wordBreak: "break-word",
            }}>
              {error}
            </pre>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="First Name">
                <StyledInput name="first_name" placeholder="First" value={formData.first_name} onChange={handleChange} />
              </Field>
              <Field label="Last Name">
                <StyledInput name="last_name" placeholder="Last" value={formData.last_name} onChange={handleChange} />
              </Field>
            </div>

            <Field label="Username *">
              <StyledInput name="username" placeholder="username" value={formData.username} onChange={handleChange} autoComplete="username" />
            </Field>

            <Field label="Email">
              <StyledInput name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
            </Field>

            <Field label="Password *">
              <StyledInput name="password" type="password" placeholder="min. 8 characters" value={formData.password} onChange={handleChange} autoComplete="new-password" />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Age">
                <StyledInput name="age" type="number" placeholder="e.g. 20" value={formData.age} onChange={handleChange} />
              </Field>
              <Field label="Year">
                <StyledInput name="year" placeholder="e.g. 2nd Year" value={formData.year} onChange={handleChange} />
              </Field>
            </div>

            <Field label="Course">
              <StyledInput name="course" placeholder="e.g. BS Computer Science" value={formData.course} onChange={handleChange} />
            </Field>

            <Field label="Sex">
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5168' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: "36px",
                  cursor: "pointer",
                }}
              >
                <option value="prefer_not">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "8px",
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={{ marginTop: "18px", textAlign: "center", fontSize: "13px", color: "#4a5168" }}>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none", border: "none",
                color: "#00e5c3", cursor: "pointer",
                fontSize: "13px", fontWeight: 600, padding: 0,
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}