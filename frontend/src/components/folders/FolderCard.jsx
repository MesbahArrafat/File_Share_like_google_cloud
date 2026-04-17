import s from './FolderCard.module.css';

export default function FolderCard({ folder, onClick, onDelete, view = 'grid' }) {
  return (
    <div className={[s.card, s[view]].join(' ')} onClick={() => onClick(folder)}>
      <div className={s.icon}>◫</div>
      <div className={s.info}>
        <div className={s.name}>{folder.name}</div>
        <div className={s.meta}>{folder.files_count} files · {folder.children_count} folders</div>
      </div>
      {onDelete && (
        <button
          type="button"
          className={s.deleteBtn}
          title="Delete folder"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder);
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
