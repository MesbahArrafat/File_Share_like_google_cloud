import s from './UploadProgress.module.css';
import { formatSize } from '../../utils/format';

export default function UploadProgress({ uploads }) {
  if (!uploads.length) return null;
  return (
    <div className={s.panel}>
      <div className={s.panelTitle}>Uploading {uploads.length} file{uploads.length>1?'s':''}</div>
      {uploads.map(u => (
        <div key={u.id} className={s.item}>
          <div className={s.itemHeader}>
            <span className={s.name}>{u.name}</span>
            <span className={[s.status, s[u.status]].join(' ')}>
              {u.status === 'done' ? '✓' : u.status === 'error' ? '✕' : u.status === 'processing' ? '⟳' : `${u.progress}%`}
            </span>
          </div>
          <div className={s.track}>
            <div className={s.bar} style={{ width:`${u.progress}%`, background: u.status==='error'?'var(--danger)':u.status==='done'?'var(--success)':'var(--accent)' }}/>
          </div>
          {u.error && <div className={s.errMsg}>{u.error}</div>}
        </div>
      ))}
    </div>
  );
}
