import { useState, useCallback } from 'react';
import { filesApi } from '../api/files';
import { CHUNK_SIZE } from '../utils/format';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function resolveChunkUploadResult(file, folderId) {
  // Chunk assembly is async on backend; poll search endpoint briefly to get the final file.
  for (let i = 0; i < 8; i++) {
    const { data } = await filesApi.search(file.name, folderId);
    const items = data.results || data;
    const match = items.find((item) => item.filename === file.name && item.size === file.size);
    if (match) return match;
    await wait(1200);
  }
  return null;
}

export function useUpload(onSuccess) {
  const [uploads, setUploads] = useState([]);

  const updateUpload = (id, patch) =>
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));

  const uploadFile = useCallback(async (file, folderId = null) => {
    const id = `${Date.now()}-${Math.random()}`;
    setUploads(prev => [...prev, { id, name: file.name, progress: 0, status: 'uploading', size: file.size }]);

    try {
      if (file.size > 10 * 1024 * 1024) {
        // Chunked upload for large files
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const { data } = await filesApi.initChunk(file.name, file.size, totalChunks, folderId);
        const uploadId = data.upload_id;

        for (let i = 0; i < totalChunks; i++) {
          const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await filesApi.uploadChunk(uploadId, i, chunk);
          updateUpload(id, { progress: Math.round(((i + 1) / totalChunks) * 100) });
        }
        updateUpload(id, { status: 'processing', progress: 100 });

        const uploadedFile = await resolveChunkUploadResult(file, folderId);
        if (uploadedFile) {
          updateUpload(id, { status: 'done', progress: 100, fileData: uploadedFile });
          onSuccess?.(uploadedFile);
        }
      } else {
        // Regular upload
        const fd = new FormData();
        fd.append('file', file);
        if (folderId) fd.append('folder', folderId);
        const { data } = await filesApi.upload(fd, (e) => {
          updateUpload(id, { progress: Math.round((e.loaded / e.total) * 100) });
        });
        updateUpload(id, { status: 'done', progress: 100, fileData: data });
        onSuccess?.(data);
      }
    } catch (err) {
      updateUpload(id, { status: 'error', error: err.response?.data?.error || 'Upload failed' });
    }

    setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 4000);
  }, [onSuccess]);

  const uploadMany = useCallback((files, folderId) => {
    Array.from(files).forEach(f => uploadFile(f, folderId));
  }, [uploadFile]);

  return { uploads, uploadFile, uploadMany };
}
