import { useState, useEffect, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import { filesApi } from '../api/files';
import { foldersApi } from '../api/folders';
import TopBar from '../components/layout/TopBar';
import FileCard from '../components/files/FileCard';
import FolderCard from '../components/folders/FolderCard';
import PreviewModal from '../components/files/PreviewModal';
import ShareModal from '../components/files/ShareModal';
import MoveModal from '../components/files/MoveModal';
import NewFolderModal from '../components/folders/NewFolderModal';
import UploadZone from '../components/files/UploadZone';
import UploadProgress from '../components/files/UploadProgress';
import Modal from '../components/shared/Modal';
import { useUpload } from '../hooks/useUpload';
import toast from 'react-hot-toast';
import s from './DashboardPage.module.css';

export default function DashboardPage() {
  const {
    files,
    setFiles,
    folders,
    setFolders,
    currentFolder,
    setCurrentFolder,
    selected,
    toggleSelect,
    clearSelect,
    loading,
    loadingMore,
    fileHasNext,
    loadFiles,
    loadMoreFiles,
    view,
    setView,
    searchQuery,
    setSearchQuery,
  } = useFiles();

  const [preview, setPreview] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [movingFile, setMovingFile] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [crumbs, setCrumbs] = useState([]);
  const fileInputRef = useRef();

  const { uploads, uploadMany } = useUpload((newFile) => {
    setFiles(p => [newFile, ...p]);
  });

  useEffect(() => {
    if (!searchQuery) loadFiles(currentFolder, 1);
  }, [currentFolder, loadFiles, searchQuery]);

  // Search
  useEffect(() => {
    if (!searchQuery) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data } = await filesApi.search(searchQuery, currentFolder);
        if (!cancelled) setFiles(data.results || data);
      } catch {
        if (!cancelled) toast.error('Search failed');
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, currentFolder, setFiles]);

  const openFolder = (folder) => {
    setCurrentFolder(folder.id);
    setCrumbs(p => [...p, folder]);
  };

  const goToCrumb = (idx) => {
    if (idx < 0) { setCurrentFolder(null); setCrumbs([]); return; }
    const crumb = crumbs[idx];
    setCurrentFolder(crumb.id);
    setCrumbs(p => p.slice(0, idx + 1));
  };

  const handleStar = async (id) => {
    const { data } = await filesApi.star(id);
    setFiles(p => p.map(f => f.id === id ? { ...f, is_starred: data.is_starred } : f));
  };

  const handleTrash = async (id) => {
    await filesApi.trash(id);
    setFiles(p => p.filter(f => f.id !== id));
    toast.success('Moved to trash');
  };

  const handleDownload = (file) => filesApi.download(file.id, file.filename);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { data } = await filesApi.rename(renameFile.id, newName);
    setFiles(p => p.map(f => f.id === data.id ? data : f));
    setRenameFile(null);
    toast.success('Renamed');
  };

  const handleZipDownload = () => {
    filesApi.zipDownload([...selected]);
    toast.success('Preparing ZIP…');
  };

  const handleUpload = (fileList) => uploadMany(fileList, currentFolder);

  const handleCreateFolder = async (name) => {
    setCreatingFolder(true);
    try {
      const { data } = await foldersApi.create({ name, parent: currentFolder });
      setFolders((prev) => [data, ...prev]);
      setNewFolderOpen(false);
      toast.success('Folder created');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Unable to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!confirm(`Delete folder "${folder.name}"?`)) return;
    try {
      await foldersApi.delete(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      toast.success('Folder deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to delete folder');
    }
  };

  const handleMoveFile = async (targetFolderId) => {
    if (!moveFile) return;

    setMovingFile(true);
    try {
      const { data } = await filesApi.move(moveFile.id, targetFolderId);
      const movedFolderId = data.folder ?? null;
      const sameContext = (currentFolder === null && movedFolderId === null) || Number(currentFolder) === Number(movedFolderId);

      if (sameContext) {
        setFiles((prev) => prev.map((file) => (file.id === data.id ? data : file)));
      } else {
        setFiles((prev) => prev.filter((file) => file.id !== data.id));
      }

      setMoveFile(null);
      toast.success('File moved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to move file');
    } finally {
      setMovingFile(false);
    }
  };

  const isEmpty = !loading && files.length === 0 && folders.length === 0;

  return (
    <UploadZone onFiles={handleUpload}>
      <div className={s.page}>
        <TopBar
          title="My Files"
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          onUpload={() => fileInputRef.current.click()}
          onNewFolder={() => setNewFolderOpen(true)}
          view={view}
          onViewChange={setView}
          selected={selected}
          onZipDownload={handleZipDownload}
          onClearSelect={clearSelect}
        />

        {/* Breadcrumbs */}
        {crumbs.length > 0 && (
          <div className={s.crumbs}>
            <button onClick={() => goToCrumb(-1)} className={s.crumb}>Home</button>
            {crumbs.map((c, i) => (
              <span key={c.id} className={s.crumbItem}>
                <span className={s.crumbSep}>›</span>
                <button onClick={() => goToCrumb(i)} className={[s.crumb, i === crumbs.length - 1 ? s.crumbActive : ''].join(' ')}>{c.name}</button>
              </span>
            ))}
          </div>
        )}

        <div className={s.content}>
          {loading ? (
            <div className={s.loadGrid}>
              {[...Array(8)].map((_, i) => <div key={i} className={s.skeleton} style={{ animationDelay: `${i * 50}ms` }} />)}
            </div>
          ) : isEmpty ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}>◫</div>
              <div className={s.emptyTitle}>This folder is empty</div>
              <div className={s.emptyText}>Upload files or drag them here to get started</div>
              <button className={s.emptyBtn} onClick={() => fileInputRef.current.click()}>+ Upload Files</button>
            </div>
          ) : (
            <>
              <div className={view === 'grid' ? s.gridView : s.listView}>
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    onClick={openFolder}
                    onDelete={handleDeleteFolder}
                    view={view}
                  />
                ))}
                {files.map((f) => (
                  <FileCard key={f.id} file={f} view={view}
                    selected={selected.has(f.id)}
                    onSelect={toggleSelect}
                    onClick={setPreview}
                    onStar={handleStar}
                    onTrash={handleTrash}
                    onShare={setShareFile}
                    onDownload={handleDownload}
                    onRename={(file) => { setRenameFile(file); setNewName(file.filename); }}
                    onMove={setMoveFile}
                  />
                ))}
              </div>
              {!searchQuery && fileHasNext && (
                <div className={s.paginationRow}>
                  <button className={s.loadMoreBtn} onClick={loadMoreFiles} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : 'Load more files'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <input ref={fileInputRef} type="file" multiple hidden onChange={e => handleUpload(e.target.files)} />
        <UploadProgress uploads={uploads} />

        <PreviewModal file={preview} onClose={() => setPreview(null)}
          onDownload={handleDownload} onStar={handleStar}
          onShare={f => { setPreview(null); setShareFile(f); }} />

        <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
        <MoveModal
          file={moveFile}
          currentFolder={currentFolder}
          onClose={() => setMoveFile(null)}
          onMove={handleMoveFile}
          loading={movingFile}
        />

        <NewFolderModal
          open={newFolderOpen}
          onClose={() => setNewFolderOpen(false)}
          onCreate={handleCreateFolder}
          loading={creatingFolder}
        />

        <Modal open={!!renameFile} onClose={() => setRenameFile(null)} title="Rename File" width={400}>
          <form onSubmit={handleRename} className={s.renameForm}>
            <input value={newName} onChange={e => setNewName(e.target.value)} className={s.renameInput} autoFocus />
            <div className={s.renameActions}>
              <button type="button" onClick={() => setRenameFile(null)} className={s.cancelBtn}>Cancel</button>
              <button type="submit" className={s.saveBtn}>Save</button>
            </div>
          </form>
        </Modal>
      </div>
    </UploadZone>
  );
}
