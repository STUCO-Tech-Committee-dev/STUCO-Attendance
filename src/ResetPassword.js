// src/ResetPassword.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth } from './firebase';
import './StudentInterface.css';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [username, setUsername] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const emailFromUsername = (u) => `${u.trim()}@stuco.local`;

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !oldPassword || !newPassword || !confirmPassword) {
            setError('Please fill out all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        try {
            const email = emailFromUsername(username);
            const userCred = await signInWithEmailAndPassword(auth, email, oldPassword);
            await updatePassword(userCred.user, newPassword);
            setSuccess('Password reset successful. Redirecting...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="student-container">
            <h2 className="student-title">Reset Password</h2>
            <form className="vote-form" onSubmit={handleReset}>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        placeholder="official exeter username"
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Old Password</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <button type="submit" className="admin-btn">Reset Password</button>
            </form>

            <div style={{ marginTop: 16 }}>
                <button className="link-btn" onClick={() => navigate('/')}>
                    ← Back to Login
                </button>
            </div>
        </div>
    );
};

export default ResetPassword;
