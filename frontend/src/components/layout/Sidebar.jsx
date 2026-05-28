import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/',                  label: 'Dashboard',       icon: '◈', roles: null },
  { to: '/events',            label: 'Events',           icon: '◷', roles: null },
  { to: '/attendance',        label: 'My Attendance',    icon: '✦', roles: ['student'] },
  { to: '/attendance-review', label: 'Review',           icon: '◉', roles: ['admin', 'staff'] },
  { to: '/analytics',         label: 'Analytics',        icon: '◬', roles: ['admin'] },
  { to: '/reports',           label: 'Reports',          icon: '◧', roles: ['admin', 'staff'] },
  { to: '/broadcasts',        label: 'Broadcasts',       icon: '◎', roles: ['admin', 'staff'] },
  { to: '/accidents',         label: 'Accidents',        icon: '⚠', roles: ['admin', 'staff'] },
  { to: '/expenditures',      label: 'Expenditures',     icon: '◈', roles: ['admin'] },
  { to: '/settings',          label: 'Settings',         icon: '◌', roles: null },
];

const ROLE_LABEL = { admin: 'Administrator', staff: 'Committee', student: 'Student' };

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const visible = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user.role));

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <span className={styles.brandDot} />
          EventSys
        </div>
        <p className={styles.brandUser}>{user.username}</p>
        <p className={styles.brandRole}>{ROLE_LABEL[user.role] || user.role}</p>
      </div>

      <nav className={styles.nav}>
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className={styles.logout}
        onClick={() => { logout(); navigate('/login'); }}
      >
        ⏻ Logout
      </button>
    </div>
  );
}