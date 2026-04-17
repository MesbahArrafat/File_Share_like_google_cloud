import s from './PreviewModal.module.css';
import { formatSize, formatDate } from '../../utils/format';

export default function PreviewModal({ file, onClose, onDownload, onStar, onShare }) {
  if (!file) return null;
  return (
    <div className={s.backdrop} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.fileInfo}>
            <span className={s.filename}>{file.filename}</span>
            <span className={s.meta}>{formatSize(file.size)} · {formatDate(file.created_at)}</span>
          </div>
          <div className={s.actions}>
            <button className={[s.btn, file.is_starred?s.starred:''].join(' ')} onClick={()=>onStar(file.id)} title="Star">✦</button>
            <button className={s.btn} onClick={()=>onShare(file)} title="Share">🔗</button>
            <button className={s.btn} onClick={()=>onDownload(file)} title="Download">⬇</button>
            <button className={s.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div className={s.body}>
          {file.is_image && file.preview_url ? (
            <img src={file.preview_url} alt={file.filename} className={s.imgPreview} />
          ) : file.is_pdf && file.preview_url ? (
            <iframe src={file.preview_url} title={file.filename} className={s.pdfFrame} />
          ) : (
            <div className={s.noPreview}>
              <div className={s.noPreviewIcon}>📄</div>
              <div className={s.noPreviewText}>No preview available for .{file.extension} files</div>
              <button className={s.downloadBtn} onClick={()=>onDownload(file)}>Download to view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
