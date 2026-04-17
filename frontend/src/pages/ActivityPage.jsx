import { useState, useEffect } from 'react';
import client from '../api/client';
import TopBar from '../components/layout/TopBar';
import { formatDate } from '../utils/format';
import s from './ActivityPage.module.css';

const ACTION_META = {
  upload: { icon: '⬆', label: 'Uploaded', color: '#4f8eff' },
  download: { icon: '⬇', label: 'Downloaded', color: '#34d399' },
  delete: { icon: '⊗', label: 'Deleted', color: '#f87171' },
  restore: { icon: '↩', label: 'Restored', color: '#34d399' },
  share: { icon: '🔗', label: 'Shared', color: '#a78bfa' },
  rename: { icon: '✏', label: 'Renamed', color: '#fbbf24' },
  move: { icon: '→', label: 'Moved', color: '#fb923c' },
  star: { icon: '✦', label: 'Starred', color: '#f59e0b' },
};

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await client.get('/activity/', { params: { page: p } });
      const results = data.results || data;
      setLogs(prev => p === 1 ? results : [...prev, ...results]);
      setHasMore(!!data.next);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  const loadMore = () => { const next = page + 1; setPage(next); load(next); };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

  const grouped = filtered.reduce((acc, log) => {
    const d = new Date(log.timestamp).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(log);
    return acc;
  }, {});

  return (
    <div className={s.page}>
      <TopBar title="Activity" />
      <div className={s.content}>
        <div className={s.filters}>
          {['all', 'upload', 'download', 'delete', 'share', 'rename'].map(f => (
            <button key={f} className={[s.filter, filter === f ? s.activeFilter : ''].join(' ')} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : ACTION_META[f]?.label || f}
            </button>
          ))}
        </div>

        {loading && page === 1 ? (
          <div className={s.loadList}>{[...Array(8)].map((_, i) => <div key={i} className={s.skel} />)}</div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>◎</div>
            <div className={s.emptyTitle}>No activity yet</div>
            <div className={s.emptyText}>File uploads and downloads will appear here</div>
          </div>
        ) : (
          <div className={s.timeline}>
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className={s.group}>
                <div className={s.dateLabel}>{formatGroupDate(date)}</div>
                <div className={s.groupItems}>
                  {items.map(log => {
                    const meta = ACTION_META[log.action] || { icon: '◎', label: log.action, color: '#8892a4' };
                    return (
                      <div key={log.id} className={s.logItem}>
                        <div className={s.logIcon} style={{ background: `${meta.color}18`, color: meta.color }}>
                          {meta.icon}
                        </div>
                        <div className={s.logInfo}>
                          <span className={s.logAction}>{meta.label}</span>
                          {log.file_name && <span className={s.logFile}>{log.file_name}</span>}
                        </div>
                        <div className={s.logTime}>{formatTime(log.timestamp)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {hasMore && (
              <button className={s.loadMore} onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatGroupDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(d);
}

function formatTime(str) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(str));
}
