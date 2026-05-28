import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.css';

export function AppLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}