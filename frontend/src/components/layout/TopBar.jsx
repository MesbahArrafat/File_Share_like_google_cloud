import { useRef } from 'react';
import s from './TopBar.module.css';

export default function TopBar({ title, onSearch, searchValue, onUpload, onNewFolder, view, onViewChange, selected, onZipDownload, onClearSelect }) {
  const inputRef = useRef();

  return (
    <div className={s.bar}>
      <div className={s.left}>
        <h1 className={s.title}>{title}</h1>
        {selected?.size > 0 && (
          <div className={s.selBadge}>
            {selected.size} selected
            <button onClick={onZipDownload} className={s.zipBtn}>⬇ ZIP</button>
            <button onClick={onClearSelect} className={s.clearBtn}>✕</button>
          </div>
        )}
      </div>
      <div className={s.right}>
        {onSearch !== undefined && (
          <div className={s.search}>
            <span className={s.searchIcon}>⌕</span>
            <input ref={inputRef} value={searchValue} onChange={e => onSearch(e.target.value)} placeholder="Search files…" className={s.searchInput} />
            {searchValue && <button onClick={() => onSearch('')} className={s.clearSearch}>✕</button>}
          </div>
        )}
        {onViewChange && (
          <div className={s.viewToggle}>
            <button className={view === 'grid' ? s.activeView : ''} onClick={() => onViewChange('grid')}>⊞</button>
            <button className={view === 'list' ? s.activeView : ''} onClick={() => onViewChange('list')}>☰</button>
          </div>
        )}
        {onUpload && (
          <button className={s.uploadBtn} onClick={onUpload}>
            <span>+</span> Upload
          </button>
        )}
        {onNewFolder && (
          <button className={s.folderBtn} onClick={onNewFolder}>
            <span>◫</span> New Folder
          </button>
        )}
      </div>
    </div>
  );
}
