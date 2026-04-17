import { useEffect } from 'react';
import s from './Modal.module.css';

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button className={s.close} onClick={onClose}>✕</button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
