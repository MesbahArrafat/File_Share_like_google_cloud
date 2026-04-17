import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import s from './NewFolderModal.module.css';

export default function NewFolderModal({ open, onClose, onCreate, loading = false }) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (!open) setName('');
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate(trimmed);
    };

    return (
        <Modal open={open} onClose={onClose} title="Create Folder" width={420}>
            <form className={s.form} onSubmit={handleSubmit}>
                <label className={s.label}>Folder Name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Project Files"
                    className={s.input}
                    autoFocus
                    disabled={loading}
                />
                <div className={s.actions}>
                    <button type="button" onClick={onClose} className={s.cancelBtn} disabled={loading}>Cancel</button>
                    <button type="submit" className={s.createBtn} disabled={loading || !name.trim()}>
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
