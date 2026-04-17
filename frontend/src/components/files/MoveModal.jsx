import { useEffect, useMemo, useState } from 'react';
import Modal from '../shared/Modal';
import { foldersApi } from '../../api/folders';
import s from './MoveModal.module.css';

function flattenTree(nodes, depth = 0, list = []) {
    nodes.forEach((node) => {
        list.push({ id: node.id, name: node.name, depth });
        if (node.children?.length) flattenTree(node.children, depth + 1, list);
    });
    return list;
}

export default function MoveModal({ file, currentFolder, onClose, onMove, loading = false }) {
    const [folderTree, setFolderTree] = useState([]);
    const [targetFolder, setTargetFolder] = useState('');

    useEffect(() => {
        if (!file) return;
        foldersApi.tree().then((r) => setFolderTree(r.data || [])).catch(() => setFolderTree([]));
        setTargetFolder(currentFolder ? String(currentFolder) : '');
    }, [file, currentFolder]);

    const options = useMemo(() => flattenTree(folderTree), [folderTree]);

    if (!file) return null;

    return (
        <Modal open={!!file} onClose={onClose} title="Move File" width={460}>
            <div className={s.box}>
                <div className={s.fileName}>{file.filename}</div>
                <label className={s.label}>Destination Folder</label>
                <select
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    className={s.select}
                    disabled={loading}
                >
                    <option value="">Root</option>
                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {'  '.repeat(opt.depth)}{opt.name}
                        </option>
                    ))}
                </select>
                <div className={s.actions}>
                    <button type="button" className={s.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        type="button"
                        className={s.moveBtn}
                        onClick={() => onMove(targetFolder ? Number(targetFolder) : null)}
                        disabled={loading}
                    >
                        {loading ? 'Moving...' : 'Move'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
