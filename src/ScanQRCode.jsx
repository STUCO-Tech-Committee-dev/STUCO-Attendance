import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { QrReader } from 'react-qr-reader';
import './AdminInterface.css';

const ScanQRCode = () => {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleScan = async (result) => {
        if (!result?.text) return;

        const sessionId = result.text.trim();

        try {
            const sessRef = doc(db, 'attendanceSessions', sessionId);
            const sessSnap = await getDoc(sessRef);

            if (!sessSnap.exists() || !sessSnap.data().open) {
                setError('No active session with that code.');
                return;
            }

            const email = auth.currentUser?.email;
            if (!email) {
                setError('User not authenticated.');
                return;
            }

            const username = email.split('@')[0];
            const userRef = doc(db, 'users', username);
            await updateDoc(userRef, {
                attendance: arrayUnion(sessionId),
            });

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Error processing QR code.');
        }
    };

    return (
        <div className="admin-container">
            <button className="admin-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>
            <h2 className="admin-title">Scan QR Code to Check In</h2>
            <div className="qr-reader">
                <QrReader
                    constraints={{ facingMode: 'environment' }}
                    onResult={handleScan}
                    style={{ width: '100%' }}
                />
            </div>
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default ScanQRCode;
