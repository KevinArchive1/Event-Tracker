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
    padding: "20px",
  },
  form: {
    width: "360px",
    background: "#fff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  title: { fontSize: "24px", fontWeight: "600", textAlign: "center", marginBottom: "6px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" },
  select: { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none", background: "white" },
  button: { background: "#2563eb", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "500", marginTop: "6px" },
  error: { color: "#dc2626", background: "#fee2e2", padding: "8px", borderRadius: "8px", fontSize: "12px" },
};

// Turns { username: ["already exists"], password: ["too short"] }
// into a readable string like "username: already exists. password: too short."
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

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    age: "",
    year: "",
    course: "",
    sex: "prefer_not",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(formData);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setError(parseErrors(data) || err.message || "Registration failed.");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Register</h1>

        {error && (
          <pre style={{ ...styles.error, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {error}
          </pre>
        )}

        <input name="username"   placeholder="Username"            value={formData.username}   onChange={handleChange} style={styles.input} />
        <input name="email"      placeholder="Email"               value={formData.email}      onChange={handleChange} style={styles.input} />
        <input name="password"   placeholder="Password" type="password" value={formData.password} onChange={handleChange} style={styles.input} />
        <input name="first_name" placeholder="First Name"          value={formData.first_name} onChange={handleChange} style={styles.input} />
        <input name="last_name"  placeholder="Last Name"           value={formData.last_name}  onChange={handleChange} style={styles.input} />
        <input name="age"        placeholder="Age" type="number"   value={formData.age}        onChange={handleChange} style={styles.input} />
        <input name="year"       placeholder="Year (e.g. 2nd Year)" value={formData.year}      onChange={handleChange} style={styles.input} />
        <input name="course"     placeholder="Course"              value={formData.course}     onChange={handleChange} style={styles.input} />

        <select name="sex" value={formData.sex} onChange={handleChange} style={styles.select}>
          <option value="prefer_not">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <button type="submit" style={styles.button}>Create Account</button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "transparent",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
}