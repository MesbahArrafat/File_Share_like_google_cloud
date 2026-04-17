import { useState } from 'react';
import { formatSize, formatDateShort, getFileIcon, getFileColor } from '../../utils/format';
import s from './FileCard.module.css';

export default function FileCard({ file, selected, onSelect, onClick, onStar, onTrash, onShare, onDownload, onRename, onMove, view = 'grid' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isImg = file.is_image && file.preview_url;
  const color = getFileColor(file);

  const handleMenu = (e, action) => { e.stopPropagation(); setMenuOpen(false); action(); };

  return (
    <div className={[s.card, s[view], selected ? s.selected : ''].join(' ')} onClick={() => onClick(file)}>
      <div className={s.checkWrap} onClick={e => { e.stopPropagation(); onSelect(file.id); }}>
        <div className={[s.check, selected ? s.checked : ''].join(' ')}>{selected ? '✓' : ''}</div>
      </div>

      {view === 'grid' ? (
        <div className={s.thumb} style={{ background: isImg ? '#000' : `${color}15`, borderColor: `${color}25` }}>
          {isImg
            ? <img src={file.preview_url} alt={file.filename} className={s.previewImg} />
            : <span className={s.fileIcon}>{getFileIcon(file)}</span>
          }
          <div className={s.ext} style={{ background: color }}>{file.extension?.toUpperCase() || 'FILE'}</div>
        </div>
      ) : (
        <div className={s.listIcon} style={{ background: `${color}20`, color }}>
          {isImg ? <img src={file.preview_url} alt="" className={s.listImg} /> : getFileIcon(file)}
        </div>
      )}

      <div className={s.info}>
        <div className={s.name} title={file.filename}>{file.filename}</div>
        <div className={s.meta}>
          <span>{formatSize(file.size)}</span>
          <span className={s.dot}>·</span>
          <span>{formatDateShort(file.created_at)}</span>
        </div>
      </div>

      <div className={s.actions} onClick={e => e.stopPropagation()}>
        <button className={[s.starBtn, file.is_starred ? s.starred : ''].join(' ')} onClick={() => onStar(file.id)} title="Star">✦</button>
        <div className={s.menuWrap}>
          <button className={s.menuBtn} onClick={() => setMenuOpen(v => !v)}>⋯</button>
          {menuOpen && (
            <>
              <div className={s.menuBackdrop} onClick={() => setMenuOpen(false)} />
              <div className={s.menu}>
                <button onClick={e => handleMenu(e, () => onDownload(file))}>⬇ Download</button>
                <button onClick={e => handleMenu(e, () => onShare(file))}>🔗 Share</button>
                <button onClick={e => handleMenu(e, () => onRename(file))}>✏ Rename</button>
                {onMove && <button onClick={e => handleMenu(e, () => onMove(file))}>→ Move</button>}
                <div className={s.menuDivider} />
                <button className={s.menuDanger} onClick={e => handleMenu(e, () => onTrash(file.id))}>⊗ Move to Trash</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
