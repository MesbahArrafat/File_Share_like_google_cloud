import { createContext, useContext, useState, useCallback } from 'react';
import { filesApi } from '../api/files';
import { foldersApi } from '../api/folders';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState('grid'); // grid | list
  const [searchQuery, setSearchQuery] = useState('');
  const [filePage, setFilePage] = useState(1);
  const [fileCount, setFileCount] = useState(0);
  const [fileHasNext, setFileHasNext] = useState(false);

  const normalizeList = (payload) => {
    const isPaged = payload && !Array.isArray(payload) && Object.prototype.hasOwnProperty.call(payload, 'results');
    if (!isPaged) {
      return {
        items: Array.isArray(payload) ? payload : [],
        count: Array.isArray(payload) ? payload.length : 0,
        hasNext: false,
      };
    }
    return {
      items: payload.results || [],
      count: payload.count ?? 0,
      hasNext: Boolean(payload.next),
    };
  };

  const loadFiles = useCallback(async (folderId = currentFolder, page = 1, { append = false } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    if (!append) setSelected(new Set());

    try {
      const params = folderId ? { folder: folderId, page } : { folder: 'root', page };
      const [filesRes, foldersRes] = await Promise.all([
        filesApi.list(params),
        foldersApi.list(folderId ? { parent: folderId, page } : { parent: 'root', page }),
      ]);

      const fileData = normalizeList(filesRes.data);
      const folderData = normalizeList(foldersRes.data);

      setFiles((prev) => (append ? [...prev, ...fileData.items] : fileData.items));
      // Folder list is scoped to current location; replacing keeps it accurate after create/move/delete.
      setFolders(folderData.items);
      setFilePage(page);
      setFileCount(fileData.count);
      setFileHasNext(fileData.hasNext);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentFolder]);

  const loadMoreFiles = useCallback(async () => {
    if (loading || loadingMore || !fileHasNext) return;
    await loadFiles(currentFolder, filePage + 1, { append: true });
  }, [currentFolder, fileHasNext, filePage, loadFiles, loading, loadingMore]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(files.map(f => f.id)));
  const clearSelect = () => setSelected(new Set());

  return (
    <FileContext.Provider value={{
      files, setFiles, folders, setFolders,
      currentFolder, setCurrentFolder,
      selected, toggleSelect, selectAll, clearSelect,
      loading, loadFiles, view, setView,
      loadingMore, filePage, fileCount, fileHasNext, loadMoreFiles,
      searchQuery, setSearchQuery,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFiles = () => useContext(FileContext);
