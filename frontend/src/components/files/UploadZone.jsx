import { useRef, useState } from 'react';
import s from './UploadZone.module.css';

export default function UploadZone({ onFiles, children }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handle = (files) => { if (files?.length) onFiles(files); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); };
  const onDrag = (e) => { e.preventDefault(); setDrag(true); };
  const onLeave = () => setDrag(false);

  return (
    <div className={[s.zone, drag?s.dragging:''].join(' ')} onDragOver={onDrag} onDragLeave={onLeave} onDrop={onDrop}>
      {drag && (
        <div className={s.overlay}>
          <div className={s.overlayContent}>
            <div className={s.overlayIcon}>⬆</div>
            <div className={s.overlayText}>Drop to upload</div>
          </div>
        </div>
      )}
      {children}
      <input ref={inputRef} type="file" multiple hidden onChange={e=>handle(e.target.files)} />
    </div>
  );
}
