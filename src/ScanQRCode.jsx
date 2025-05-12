// src/ScanQRCode.jsx
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef
  } from 'react';
  import { useNavigate } from 'react-router-dom';
  import QrReader from 'modern-react-qr-reader';
  import { auth, db } from './firebase';
  import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
  import './AdminInterface.css';
  
  const ScanQRCode = () => {
    const [error, setError] = useState('');
    const [legacyMode, setLegacyMode] = useState(false);
    const qrRef = useRef(null);
    const navigate = useNavigate();
  
    // Redirect if not logged in
    useEffect(() => {
      if (!auth.currentUser) {
        navigate('/');
      }
    }, [navigate]);
  
    // Handler when a QR is successfully scanned
    const handleScan = useCallback(
      async (data) => {
        if (!data) return;
        const sessionId = data.trim();
        const sessRef = doc(db, 'attendanceSessions', sessionId);
        const sessSnap = await getDoc(sessRef);
  
        if (!sessSnap.exists() || !sessSnap.data().open) {
          setError('No active session with that code.');
          return;
        }
  
        const email = auth.currentUser.email;
        const username = email.split('@')[0];
        const userRef = doc(db, 'users', username);
  
        await updateDoc(userRef, {
          attendance: arrayUnion(sessionId)
        });
  
        navigate('/dashboard');
      },
      [navigate]
    );
  
    // Error handler: if camera is unsupported, flip into legacyMode
    const handleError = useCallback((err) => {
      console.error(err);
      setError('Camera error: ' + err.message);
      setLegacyMode(true);
    }, []);
  
    // Open the image-picker dialog (for legacyMode)
    const openImageDialog = () => {
      if (qrRef.current) {
        qrRef.current.openImageDialog();
      }
    };
  
    // Keep the camera facing config stable
    const videoConstraints = useMemo(
      () => ({ facingMode: 'environment' }),
      []
    );
  
    return (
      <div className="admin-container">
        <button
          className="admin-btn"
          style={{ marginBottom: '1rem' }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
  
        <h2 className="admin-title">Scan QR Code to Check In</h2>
  
        <div className="qr-container">
          {/* If legacyMode is on, show a button to let user pick/take a photo */}
          {legacyMode && (
            <button
              className="admin-btn"
              style={{ marginBottom: '1rem' }}
              onClick={openImageDialog}
            >
              📸 Take/Upload Photo
            </button>
          )}
  
          <QrReader
            ref={qrRef}
            delay={500}
            onError={handleError}
            onScan={handleScan}
            // prefer the native facingMode prop; constraints is optional
            facingMode="environment"
            resolution={600}
            legacyMode={legacyMode}
            showViewFinder={!legacyMode}
            style={{ width: '100%' }}
            constraints={videoConstraints}
          />
        </div>
  
        {error && <div className="error">{error}</div>}
      </div>
    );
  };
  
  export default ScanQRCode;
  