import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { foldersApi } from '../../api/folders';
import { formatSize } from '../../utils/format';
import s from './Sidebar.module.css';

const LINKS = [
  { to: '/', label: 'My Files', icon: '◫' },
  { to: '/starred', label: 'Starred', icon: '✦' },
  { to: '/trash', label: 'Trash', icon: '⊗' },
  { to: '/activity', label: 'Activity', icon: '◎' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { setCurrentFolder } = useFiles();
  const [folderTree, setFolderTree] = useState([]);
  const nav = useNavigate();

  const handleLogout = async () => { await logout(); nav('/login'); };
  const pct = user?.storage_percent ?? 0;

  useEffect(() => {
    foldersApi.tree()
      .then((r) => setFolderTree(r.data || []))
      .catch(() => setFolderTree([]));
  }, []);

  const openTreeFolder = (id) => {
    setCurrentFolder(id);
    nav('/');
  };

  return (
    <aside className={s.sidebar}>
      <div className={s.logo}>
        <span className={s.logoIcon}>◈</span>
        <span className={s.logoText}>FileShare</span>
      </div>

      <nav className={s.nav}>
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => [s.link, isActive ? s.active : ''].join(' ')}>
            <span className={s.linkIcon}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
        <NavLink to="/profile" className={({ isActive }) => [s.link, isActive ? s.active : ''].join(' ')}>
          <span className={s.linkIcon}>◉</span>
          Profile
        </NavLink>
      </nav>

      <div className={s.treeWrap}>
        <div className={s.treeTitle}>Folders</div>
        <button className={s.rootFolderBtn} onClick={() => openTreeFolder(null)}>• Root</button>
        <FolderTree nodes={folderTree} onOpen={openTreeFolder} depth={0} />
      </div>

      <div className={s.spacer} />

      {user && (
        <div className={s.storage}>
          <div className={s.storageLabel}>
            <span>Storage</span>
            <span className={s.storageVal}>{formatSize(user.storage_used)} / {formatSize(user.storage_limit)}</span>
          </div>
          <div className={s.track}>
            <div className={s.bar} style={{ width: `${Math.min(pct, 100)}%`, background: pct > 85 ? 'var(--danger)' : pct > 65 ? 'var(--warning)' : 'var(--accent)' }} />
          </div>
          <div className={s.storagePercent}>{pct}% used</div>
        </div>
      )}

      <div className={s.user}>
        <div className={s.avatar}>{user?.username?.[0]?.toUpperCase() || '?'}</div>
        <div className={s.userInfo}>
          <div className={s.userName}>{user?.username}</div>
          <div className={s.userEmail}>{user?.email}</div>
        </div>
        <button className={s.logoutBtn} onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}

function FolderTree({ nodes, onOpen, depth }) {
  if (!nodes?.length) return null;
  return (
    <div className={s.treeList}>
      {nodes.map((node) => (
        <div key={node.id} className={s.treeItem}>
          <button
            className={s.treeBtn}
            style={{ paddingLeft: `${10 + depth * 12}px` }}
            onClick={() => onOpen(node.id)}
          >
            ◫ {node.name}
          </button>
          {!!node.children?.length && <FolderTree nodes={node.children} onOpen={onOpen} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
