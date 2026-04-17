import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { filesApi } from '../../api/files';
import s from './ShareModal.module.css';
import toast from 'react-hot-toast';

export default function ShareModal({ file, onClose }) {
  const [shareLink, setShareLink] = useState('');
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    const base = window.location.origin;
    setShareLink(`${base}/share/${file.share_token}`);
    filesApi.getShares(file.id).then(r => setShares(r.data)).catch(() => { });
  }, [file]);

  const copy = () => { navigator.clipboard.writeText(shareLink); toast.success('Link copied!'); };

  const regenerate = async () => {
    setLoading(true);
    try {
      const { data } = await filesApi.generateShareLink(file.id);
      setShareLink(data.share_link);
      toast.success('New link generated');
    } finally { setLoading(false); }
  };

  const addShare = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await filesApi.shareWith(file.id, email, true);
      setShares(p => [...p, data]);
      setEmail('');
      toast.success(`Shared with ${email}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'User not found');
    } finally { setLoading(false); }
  };

  const removeShare = async (shareEmail) => {
    await filesApi.removeShare(file.id, shareEmail);
    setShares(prev => prev.filter((share) => share.shared_with_email_read !== shareEmail));
    toast.success('Access removed');
  };

  if (!file) return null;
  return (
    <Modal open={!!file} onClose={onClose} title="Share File" width={480}>
      <div className={s.section}>
        <label className={s.label}>Share link</label>
        <div className={s.linkRow}>
          <input readOnly value={shareLink} className={s.linkInput} />
          <button onClick={copy} className={s.copyBtn}>Copy</button>
        </div>
        <button onClick={regenerate} disabled={loading} className={s.regenBtn}>↻ Regenerate link</button>
      </div>
      <div className={s.divider} />
      <div className={s.section}>
        <label className={s.label}>Share with user</label>
        <form onSubmit={addShare} className={s.addRow}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={s.emailInput} type="email" />
          <button type="submit" disabled={loading || !email} className={s.addBtn}>Add</button>
        </form>
        {shares.length > 0 && (
          <div className={s.shareList}>
            {shares.map(sh => (
              <div key={sh.id} className={s.shareItem}>
                <div className={s.shareAvatar}>{sh.shared_with_username?.[0]?.toUpperCase()}</div>
                <div className={s.shareUser}>
                  <span>{sh.shared_with_username}</span>
                  <span className={s.shareEmail}>{sh.shared_with_email_read}</span>
                </div>
                <button onClick={() => removeShare(sh.shared_with_email_read)} className={s.removeBtn}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
