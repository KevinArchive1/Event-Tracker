// ─── Badge ────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active:      { bg: "#dcfce7", color: "#15803d" },
  ended:       { bg: "#fee2e2", color: "#b91c1c" },
  preparation: { bg: "#fef9c3", color: "#92400e" },
  pending:     { bg: "#fef9c3", color: "#92400e" },
  approved:    { bg: "#dcfce7", color: "#15803d" },
  rejected:    { bg: "#fee2e2", color: "#b91c1c" },
  request:     { bg: "#e0e7ff", color: "#3730a3" },
  update:      { bg: "#e0f2fe", color: "#0369a1" },
  issue:       { bg: "#fce7f3", color: "#9d174d" },
  admin:       { bg: "#f3e8ff", color: "#6b21a8" },
  staff:       { bg: "#e0f2fe", color: "#0369a1" },
  student:     { bg: "#f0fdf4", color: "#15803d" },
};

export function Badge({ label }) {
  const key = (label || "").toLowerCase();
  const { bg, color } = STATUS_COLORS[key] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "99px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.03em",
      textTransform: "capitalize",
      background: bg,
      color,
    }}>
      {label}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      border: "1px solid #f1f5f9",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ title, value, accent = false, icon }) {
  return (
    <div style={{
      background: accent ? "#6366f1" : "#fff",
      color: accent ? "#fff" : "#111827",
      borderRadius: "12px",
      padding: "20px 24px",
      boxShadow: accent
        ? "0 4px 14px rgba(99,102,241,0.35)"
        : "0 1px 4px rgba(0,0,0,0.07)",
      border: accent ? "none" : "1px solid #f1f5f9",
    }}>
      <p style={{ margin: 0, fontSize: "12px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </p>
      <h2 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 700 }}>{value ?? "—"}</h2>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 32 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <div style={{
        width: size, height: size,
        border: "3px solid #e5e7eb",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ message = "Nothing here yet." }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "28px",
          width: "min(480px, 90vw)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" }}
            >×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:  { background: "#6366f1", color: "#fff", border: "none" },
  success:  { background: "#22c55e", color: "#fff", border: "none" },
  danger:   { background: "#ef4444", color: "#fff", border: "none" },
  ghost:    { background: "#f3f4f6", color: "#374151", border: "none" },
  outline:  { background: "transparent", color: "#6366f1", border: "1px solid #6366f1" },
};

export function Button({ children, variant = "primary", onClick, disabled, style = {}, type = "button" }) {
  const base = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, style = {}, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</label>}
      <input
        {...props}
        style={{
          padding: "9px 12px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          fontSize: "14px",
          outline: "none",
          background: "#fafafa",
          ...style,
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, children, style = {}, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</label>}
      <select
        {...props}
        style={{
          padding: "9px 12px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          fontSize: "14px",
          outline: "none",
          background: "#fafafa",
          ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = "error", message }) {
  if (!message) return null;
  const colors = {
    error:   { bg: "#fee2e2", color: "#b91c1c" },
    success: { bg: "#dcfce7", color: "#15803d" },
    info:    { bg: "#e0e7ff", color: "#3730a3" },
  };
  const c = colors[type] || colors.error;
  return (
    <div style={{
      background: c.bg, color: c.color,
      padding: "10px 14px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: 500,
    }}>
      {message}
    </div>
  );
}