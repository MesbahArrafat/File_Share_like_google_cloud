import { useState, useEffect } from 'react';
import { filesApi } from '../api/files';
import TopBar from '../components/layout/TopBar';
import { formatSize, formatDate, getFileIcon, getFileColor } from '../utils/format';
import toast from 'react-hot-toast';
import s from './TrashPage.module.css';

export default function TrashPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await filesApi.trashList();
      setFiles(data.results || data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(files.map(f => f.id)));
  const clearSel = () => setSelected(new Set());

  const restore = async (id) => {
    await filesApi.restore(id);
    setFiles(p => p.filter(f => f.id !== id));
    setSelected(p => { const n = new Set(p); n.delete(id); return n; });
    toast.success('File restored');
  };

  const permDelete = async (id) => {
    if (!confirm('Permanently delete this file? This cannot be undone.')) return;
    await filesApi.permDelete(id);
    setFiles(p => p.filter(f => f.id !== id));
    toast.success('File permanently deleted');
  };

  const restoreSelected = async () => {
    await Promise.all([...selected].map(id => filesApi.restore(id)));
    setFiles(p => p.filter(f => !selected.has(f.id)));
    setSelected(new Set());
    toast.success(`Restored ${selected.size} files`);
  };

  const deleteSelected = async () => {
    if (!confirm(`Permanently delete ${selected.size} files? This cannot be undone.`)) return;
    await Promise.all([...selected].map(id => filesApi.permDelete(id)));
    setFiles(p => p.filter(f => !selected.has(f.id)));
    setSelected(new Set());
    toast.success(`Deleted ${selected.size} files`);
  };

  return (
    <div className={s.page}>
      <TopBar title="Trash" />
      <div className={s.content}>
        {selected.size > 0 && (
          <div className={s.bulkBar}>
            <span>{selected.size} selected</span>
            <div className={s.bulkActions}>
              <button onClick={restoreSelected} className={s.restoreAllBtn}>↩ Restore all</button>
              <button onClick={deleteSelected} className={s.deleteAllBtn}>⊗ Delete all</button>
              <button onClick={clearSel} className={s.clearBtn}>✕</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={s.loading}>
            {[...Array(5)].map((_,i) => <div key={i} className={s.skel}/>)}
          </div>
        ) : files.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>⊗</div>
            <div className={s.emptyTitle}>Trash is empty</div>
            <div className={s.emptyText}>Deleted files will appear here</div>
          </div>
        ) : (
          <>
            <div className={s.notice}>Files in trash are kept for 30 days before permanent deletion.</div>
            <div className={s.list}>
              {files.map(f => {
                const color = getFileColor(f);
                return (
                  <div key={f.id} className={[s.item, selected.has(f.id)?s.sel:''].join(' ')}>
                    <div className={s.checkWrap} onClick={() => toggle(f.id)}>
                      <div className={[s.check, selected.has(f.id)?s.checked:''].join(' ')}>{selected.has(f.id)?'✓':''}</div>
                    </div>
                    <div className={s.icon} style={{ background:`${color}18`, color }}>
                      {f.is_image && f.preview_url
                        ? <img src={f.preview_url} alt="" className={s.thumb}/>
                        : getFileIcon(f)
                      }
                    </div>
                    <div className={s.info}>
                      <div className={s.name}>{f.filename}</div>
                      <div className={s.meta}>
                        {formatSize(f.size)} · Deleted {formatDate(f.deleted_at)}
                      </div>
                    </div>
                    <div className={s.actions}>
                      <button onClick={() => restore(f.id)} className={s.restoreBtn} title="Restore">↩ Restore</button>
                      <button onClick={() => permDelete(f.id)} className={s.deleteBtn} title="Delete forever">⊗</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
