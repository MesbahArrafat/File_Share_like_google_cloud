import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatSize, formatDate, getFileIcon } from '../utils/format';
import s from './SharedFilePage.module.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export default function SharedFilePage() {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSharedFile = async () => {
      setLoading(true);
      setError('');
      try {
        const accessToken = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/share/${token}/`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error || 'File not found or access denied');
          return;
        }

        setFile(payload);
      } catch {
        setError('Unable to load shared file');
      } finally {
        setLoading(false);
      }
    };

    loadSharedFile();
  }, [token]);

  const download = () => {
    window.open(`${API_BASE}/share/${token}/?action=download`, '_blank');
  };

  if (loading) return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.loadingSpinner} />
        <p className={s.loadingText}>Loading file…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.errorIcon}>⊗</div>
        <h2 className={s.errorTitle}>Access Denied</h2>
        <p className={s.errorText}>{error}</p>
        <a href="/" className={s.homeBtn}>Go to FileShare</a>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.logo}>
          <span className={s.logoIcon}>◈</span>
          <span className={s.logoText}>FileShare</span>
        </div>
        <p className={s.sharedLabel}>Shared file</p>
      </div>

      <div className={s.card}>
        <div className={s.preview}>
          {file.is_image && file.preview_url
            ? <img src={file.preview_url} alt={file.filename} className={s.previewImg} />
            : file.is_pdf && file.preview_url
              ? <iframe src={file.preview_url} title={file.filename} className={s.previewFrame} />
              : (
                <div className={s.noPreview}>
                  <span className={s.fileIcon}>{getFileIcon(file)}</span>
                </div>
              )
          }
        </div>

        <div className={s.info}>
          <div className={s.filename}>{file.filename}</div>
          <div className={s.meta}>
            <span className={s.metaItem}>{formatSize(file.size)}</span>
            <span className={s.dot}>·</span>
            <span className={s.metaItem}>.{file.extension?.toUpperCase()}</span>
            <span className={s.dot}>·</span>
            <span className={s.metaItem}>{formatDate(file.created_at)}</span>
          </div>
          <button onClick={download} className={s.downloadBtn}>
            ⬇ Download File
          </button>
        </div>
      </div>
    </div>
  );
}
