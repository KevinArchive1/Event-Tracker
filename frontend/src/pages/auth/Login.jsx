import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #2563eb, #7c3aed, #ec4899)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    width: "320px",
    background: "#fff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: { fontSize: "24px", fontWeight: "600", textAlign: "center", marginBottom: "8px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" },
  button: { background: "#2563eb", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500" },
  error: { color: "#dc2626", background: "#fee2e2", padding: "8px", borderRadius: "8px", fontSize: "12px", textAlign: "center" },
};

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(formData.username, formData.password);
      // Removed: console.log("TOKEN:", ...) — leaked auth token to browser console
      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Login</h1>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
        <button
          type="button"
          onClick={() => navigate("/register")}
          style={{
            background: "transparent",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Don't have an account? Register
      </button>
      </form>
    </div>
  );
}