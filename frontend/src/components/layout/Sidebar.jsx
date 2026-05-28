import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// roles: null = everyone, array = those roles only
const NAV_ITEMS = [
  { to: "/",                  label: "Dashboard",       icon: "📊", roles: null },
  { to: "/events",            label: "Events",           icon: "📅", roles: null },
  { to: "/attendance",        label: "My Attendance",    icon: "✅", roles: ["student"] },
  { to: "/attendance-review", label: "Review",           icon: "🔍", roles: ["admin", "staff"] },
  { to: "/analytics",         label: "Analytics",        icon: "📈", roles: ["admin"] },
  { to: "/reports",           label: "Reports",          icon: "📝", roles: ["admin", "staff"] },
  { to: "/broadcasts",        label: "Broadcasts",       icon: "📣", roles: ["admin", "staff"] },
  { to: "/accidents",         label: "Accidents",        icon: "🚨", roles: ["admin", "staff"] },
  { to: "/expenditures",      label: "Expenditures",     icon: "💰", roles: ["admin"] },
  { to: "/settings",          label: "Settings",         icon: "⚙️",  roles: null },
];

const ROLE_LABEL = { admin: "Administrator", staff: "Committee Member", student: "Student" };

const linkStyle = (isActive) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "9px 12px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "13.5px",
  fontWeight: isActive ? 600 : 400,
  background: isActive ? "#ede9fe" : "transparent",
  color: isActive ? "#5b21b6" : "#4b5563",
  transition: "background 0.15s, color 0.15s",
});

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <div style={{
      width: "220px",
      minHeight: "100vh",
      background: "#fff",
      borderRight: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      padding: "20px 12px",
      gap: "4px",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "4px 12px 20px", borderBottom: "1px solid #f1f5f9", marginBottom: 8 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "32px", color: "#1f2937" }}>
            Event System
        </p>
        <p style={{ margin: 0, fontSize: "16px", color: "#6366f1", fontWeight: 600 }}>
          {user.username}
        </p>
        <p style={{ margin: 0, fontSize: "16px", color: "#9ca3af" }}>
          {ROLE_LABEL[user.role] || user.role}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => linkStyle(isActive)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate("/login"); }}
        style={{
          margin: "16px 0 0",
          padding: "9px 12px",
          background: "none",
          border: "1px solid #fee2e2",
          borderRadius: "8px",
          color: "#dc2626",
          fontSize: "13px",
          cursor: "pointer",
          textAlign: "left",
          fontWeight: 600,
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}