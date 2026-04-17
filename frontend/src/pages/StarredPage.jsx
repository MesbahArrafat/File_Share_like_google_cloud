import { useState, useEffect } from 'react';
import { filesApi } from '../api/files';
import TopBar from '../components/layout/TopBar';
import FileCard from '../components/files/FileCard';
import PreviewModal from '../components/files/PreviewModal';
import ShareModal from '../components/files/ShareModal';
import { useFiles } from '../context/FileContext';
import toast from 'react-hot-toast';
import s from './StarredPage.module.css';

export default function StarredPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const { view, setView } = useFiles();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await filesApi.starredList();
      setFiles(data.results || data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStar = async (id) => {
    const { data } = await filesApi.star(id);
    if (!data.is_starred) setFiles(p => p.filter(f => f.id !== id));
    else setFiles(p => p.map(f => f.id === id ? { ...f, is_starred: true } : f));
    toast.success(data.is_starred ? 'Starred' : 'Unstarred');
  };

  const handleTrash = async (id) => {
    await filesApi.trash(id);
    setFiles(p => p.filter(f => f.id !== id));
    toast.success('Moved to trash');
  };

  const handleDownload = (file) => filesApi.download(file.id, file.filename);

  return (
    <div className={s.page}>
      <TopBar title="Starred" view={view} onViewChange={setView} />
      <div className={s.content}>
        {loading ? (
          <div className={view==='grid'?s.gridSkel:s.listSkel}>
            {[...Array(6)].map((_,i) => <div key={i} className={s.skel}/>)}
          </div>
        ) : files.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>✦</div>
            <div className={s.emptyTitle}>No starred files</div>
            <div className={s.emptyText}>Star important files to find them here quickly</div>
          </div>
        ) : (
          <div className={view==='grid' ? s.gridView : s.listView}>
            {files.map(f => (
              <FileCard key={f.id} file={f} view={view}
                selected={false} onSelect={() => {}}
                onClick={setPreview}
                onStar={handleStar}
                onTrash={handleTrash}
                onShare={setShareFile}
                onDownload={handleDownload}
                onRename={() => {}}
              />
            ))}
          </div>
        )}
      </div>
      <PreviewModal file={preview} onClose={() => setPreview(null)}
        onDownload={handleDownload} onStar={handleStar}
        onShare={f => { setPreview(null); setShareFile(f); }} />
      <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
    </div>
  );
}
