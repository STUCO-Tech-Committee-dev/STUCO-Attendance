import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, query, where, collection, getDocs } from 'firebase/firestore';
import './AdminInterface.css'; // add the CSS below into this file

const ScanQRCode = () => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // redirect if not logged in
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
    }
  }, [navigate]);

  // initialize scanner
  useEffect(() => {
    if (!videoRef.current) return;

    scannerRef.current = new QrScanner(
      videoRef.current,
      async result => {
        const sessionId = result.data.trim();
        const sessRef = doc(db, 'attendanceSessions', sessionId);
        const sessSnap = await getDoc(sessRef);
        if (!sessSnap.exists() || !sessSnap.data().open) {
          setError('No active session with that code.');
          return;
        }

        const sessionData = sessSnap.data();
        if (!sessionData.createdAt) {
          setError('Session creation date is missing or invalid.');
          return;
        }

        // Normalize the session date to YYYY-MM-DD format
        const sessionDate = sessionData.createdAt.toDate().toISOString().split('T')[0];

        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        // Check if the user is a proxy
        const proxyQuery = query(
          collection(db, 'proxyRequests'),
          where('proxy', '==', username),
          where('date', '==', sessionDate) // Match normalized session date
        );
        const proxySnap = await getDocs(proxyQuery);

        if (!proxySnap.empty) {
          const proxyRequest = proxySnap.docs[0].data();
          const originalUserRef = doc(db, 'users', proxyRequest.username);

          // Add "(Proxy)" to the original user's attendance
          await updateDoc(originalUserRef, {
            attendance: arrayUnion(`${sessionId} (Proxy)`)
          });
        } else {
          // Add session ID to the current user's attendance
          const userRef = doc(db, 'users', username);
          await updateDoc(userRef, {
            attendance: arrayUnion(sessionId)
          });
        }

        scannerRef.current.stop();
        navigate('/dashboard');
      },
      {
        onDecodeError: err => {
          // decode errors (i.e. no qr found) ignored
        },
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        overlay: overlayRef.current
      }
    );

    scannerRef.current
      .start()
      .catch(err => {
        console.error(err);
        setError('Camera blocked or not accessible. Please enable camera permissions.');
      });

    return () => {
      scannerRef.current.stop();
    };
  }, [navigate]);

  return (
    <div className="admin-container">
      <button className="admin-btn" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 className="admin-title">Scan QR Code to Check In</h2>
      <div className="qr-reader">
        <video ref={videoRef} className="qr-video" />
        <div ref={overlayRef} className="qr-box" />
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ScanQRCode;
