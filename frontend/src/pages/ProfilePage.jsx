import { useEffect, useState } from 'react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { formatSize } from '../utils/format';
import toast from 'react-hot-toast';
import s from './ProfilePage.module.css';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [profileForm, setProfileForm] = useState({ username: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', new_password2: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        setProfileForm({
            username: user?.username || '',
            email: user?.email || '',
        });
    }, [user]);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await authApi.updateProfile(profileForm);
            await refreshUser();
            toast.success('Profile updated');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.new_password2) {
            toast.error('New passwords do not match');
            return;
        }

        setSavingPassword(true);
        try {
            await authApi.changePassword({
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password,
                new_password2: passwordForm.new_password2,
            });
            setPasswordForm({ old_password: '', new_password: '', new_password2: '' });
            toast.success('Password changed');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className={s.page}>
            <TopBar title="Profile" />
            <div className={s.content}>
                <div className={s.grid}>
                    <section className={s.card}>
                        <h2 className={s.cardTitle}>Account Details</h2>
                        <form className={s.form} onSubmit={saveProfile}>
                            <label className={s.label}>Username</label>
                            <input
                                className={s.input}
                                value={profileForm.username}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                                required
                            />

                            <label className={s.label}>Email</label>
                            <input
                                className={s.input}
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                                required
                            />

                            <button className={s.primaryBtn} type="submit" disabled={savingProfile}>
                                {savingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </section>

                    <section className={s.card}>
                        <h2 className={s.cardTitle}>Storage</h2>
                        <div className={s.statRow}><span>Used</span><strong>{formatSize(user?.storage_used || 0)}</strong></div>
                        <div className={s.statRow}><span>Limit</span><strong>{formatSize(user?.storage_limit || 0)}</strong></div>
                        <div className={s.statRow}><span>Usage</span><strong>{user?.storage_percent || 0}%</strong></div>
                        <div className={s.track}>
                            <div className={s.bar} style={{ width: `${Math.min(user?.storage_percent || 0, 100)}%` }} />
                        </div>
                    </section>

                    <section className={s.card}>
                        <h2 className={s.cardTitle}>Change Password</h2>
                        <form className={s.form} onSubmit={changePassword}>
                            <label className={s.label}>Current Password</label>
                            <input
                                className={s.input}
                                type="password"
                                value={passwordForm.old_password}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))}
                                required
                            />

                            <label className={s.label}>New Password</label>
                            <input
                                className={s.input}
                                type="password"
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                                required
                            />

                            <label className={s.label}>Confirm New Password</label>
                            <input
                                className={s.input}
                                type="password"
                                value={passwordForm.new_password2}
                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password2: e.target.value }))}
                                required
                            />

                            <button className={s.primaryBtn} type="submit" disabled={savingPassword}>
                                {savingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
