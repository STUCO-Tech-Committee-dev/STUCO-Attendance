import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation(); // Access location state
  const isProxyRequest = Boolean(location.state?.isProxyRequest);
  // redirect if not logged in
  useEffect(() => {
    if (!auth.currentUser && !isProxyRequest) {
      // Redirect to the AuthPage only if the user is not logged in and it's not a proxy request
      navigate('/');
    }
  }, [navigate, isProxyRequest]);

  // initialize scanner
  useEffect(() => {
    if (!videoRef.current) return;

    scannerRef.current = new QrScanner(
      videoRef.current,
      async result => {
        try {
          const sessionId = result.data.trim(); // Ensure sessionId is properly extracted
          const sessRef = doc(db, 'attendanceSessions', sessionId);
          const sessSnap = await getDoc(sessRef);

          if (!sessSnap.exists() || !sessSnap.data().open) {
            setError('No active session with that code.');
            return;
          }

          if (isProxyRequest) {
            // Navigate to ProxyRequest form with sessionId
            scannerRef.current.stop();
            navigate('/proxy-request', { state: { sessionId } });
          } else {
            // Handle attendance logic
            const sessionData = sessSnap.data();
            if (!sessionData.createdAt) {
              setError('Session creation date is missing or invalid.');
              return;
            }

            const sessionDate = sessionData.createdAt
              .toDate()
              .toLocaleDateString("en-US", { timeZone: "America/New_York" });
            const email = auth.currentUser.email;
            const username = email.split('@')[0];

            const proxyQuery = query(
              collection(db, 'proxyRequests'),
              where('proxy', '==', username),
              where('date', '==', sessionDate)
            );
            const proxySnap = await getDocs(proxyQuery);

            if (!proxySnap.empty) {
              const proxyRequest = proxySnap.docs[0].data();
              const originalUserRef = doc(db, 'users', proxyRequest.username);

              await updateDoc(originalUserRef, {
                attendance: arrayUnion(`${sessionId} (Proxy)`)
              });
            } else {
              const userRef = doc(db, 'users', username);
              await updateDoc(userRef, {
                attendance: arrayUnion(sessionId)
              });
            }

            scannerRef.current.stop();
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('Error processing QR code:', err);
          setError('Failed to process QR code. Please try again.');
        }
      },
      {
        onDecodeError: () => {
          // Ignore decode errors (e.g., no QR code found)
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
        console.error('Camera error:', err);
        setError('Camera blocked or not accessible. Please enable camera permissions.');
      });

    return () => {
      scannerRef.current.stop();
    };
  }, [navigate, isProxyRequest]);

  return (
    <div className="admin-container">
      <button className="admin-btn" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 className="admin-title">
        {isProxyRequest ? 'Scan QR Code to Submit Proxy Request' : 'Scan QR Code to Check In'}
      </h2>
      <div className="qr-reader">
        <video ref={videoRef} className="qr-video" />
        <div ref={overlayRef} className="qr-box" />
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ScanQRCode;
