import Sidebar from './Sidebar';
import s from './AppLayout.module.css';

export default function AppLayout({ children }) {
  return (
    <div className={s.layout}>
      <Sidebar />
      <main className={s.main}>{children}</main>
    </div>
  );
}
