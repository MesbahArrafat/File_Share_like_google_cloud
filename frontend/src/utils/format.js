export const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (str) => {
  if (!str) return '';
  return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(str));
};

export const formatDateShort = (str) => {
  if (!str) return '';
  return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric' }).format(new Date(str));
};

export const getFileIcon = (file) => {
  const ext = file.extension?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return '🎬';
  if (['mp3','wav','ogg','flac','aac'].includes(ext)) return '🎵';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '📦';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📋';
  if (['js','jsx','ts','tsx','py','java','go','rs','cpp','c'].includes(ext)) return '💻';
  if (['json','xml','yaml','yml','toml'].includes(ext)) return '⚙️';
  return '📁';
};

export const getFileColor = (file) => {
  const ext = file.extension?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '#34d399';
  if (ext === 'pdf') return '#f87171';
  if (['mp4','mov','avi'].includes(ext)) return '#a78bfa';
  if (['mp3','wav','ogg'].includes(ext)) return '#fb923c';
  if (['zip','rar','7z'].includes(ext)) return '#fbbf24';
  if (['doc','docx'].includes(ext)) return '#60a5fa';
  if (['xls','xlsx','csv'].includes(ext)) return '#34d399';
  if (['js','jsx','ts','tsx','py'].includes(ext)) return '#f59e0b';
  return '#8892a4';
};

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
