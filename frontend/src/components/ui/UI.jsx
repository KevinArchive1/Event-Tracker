import styles from './UI.module.css';

// ── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ label }) {
  const key = (label || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const cls = styles[`badge_${key}`] || styles.badge_default;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, className = '', ...props }) {
  return (
    <div className={`${styles.card} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

// ── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, accent = false, icon }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCard_accent : ''}`}>
      <p className={styles.statLabel}>
        {icon && <span>{icon}</span>}
        {title}
      </p>
      <h2 className={styles.statValue}>{value ?? '—'}</h2>
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 32 }) {
  return (
    <div className={styles.spinnerWrap}>
      <div
        className={styles.spinner}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>📭</div>
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {title && (
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{title}</h3>
            <button className={styles.modalClose} onClick={onClose}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
const VARIANTS = {
  primary: styles.btn_primary,
  success: styles.btn_success,
  danger:  styles.btn_danger,
  ghost:   styles.btn_ghost,
  outline: styles.btn_outline,
};

export function Button({ children, variant = 'primary', onClick, disabled, style, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${styles.btn} ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, style, className = '', ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <input {...props} style={style} className={`${styles.input} ${className}`} />
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, children, style, className = '', ...props }) {
  return (
    <div className={styles.fieldWrap}>
      {label && <label className={styles.label}>{label}</label>}
      <select {...props} style={style} className={`${styles.select} ${className}`}>
        {children}
      </select>
    </div>
  );
}

// ── Alert ───────────────────────────────────────────────────────────────────
export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const cls = {
    error:   styles.alert_error,
    success: styles.alert_success,
    info:    styles.alert_info,
  };
  return <div className={`${styles.alert} ${cls[type] || cls.error}`}>{message}</div>;
}