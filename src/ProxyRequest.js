import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import './StudentInterface.css';

const ProxyRequest = ({ embeddedFromHome = false }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [qrVerified, setQrVerified] = useState(false);
  const [expectedCode, setExpectedCode] = useState(null);
  const [requester, setRequester] = useState('');
  const [delegate, setDelegate] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const q = query(collection(db, 'attendanceSessions'), where('open', '==', true));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const sessionData = querySnapshot.docs[0].data();
          setExpectedCode(sessionData.qrCode || sessionData.code || '');
        }
      } catch (err) {
        console.error('Error fetching QR code:', err);
        setError('Could not fetch QR code.');
      }
    };

    fetchQRCode();
  }, []);

  useEffect(() => {
    if (!expectedCode || !videoRef.current) return;

    QrScanner.WORKER_PATH = 'https://unpkg.com/qr-scanner/qr-scanner-worker.min.js';

    const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data.trim() === expectedCode.trim()) {
            setQrVerified(true);
            setError('');
            scanner.stop();
          } else {
            setQrVerified(false);
            setError('Scanned QR is invalid for the current session.');
          }
        },
        {
          highlightScanRegion: true,
          returnDetailedScanResult: true,
        }
    );

    scannerRef.current = scanner;
    scanner.start().catch((err) => {
      console.error('QR Scanner start error:', err);
      setError('Failed to access camera.');
    });

    return () => {
      scanner.stop();
    };
  }, [expectedCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!qrVerified) {
      setError('You must scan a valid QR code before submitting.');
      return;
    }

    if (!requester || !delegate || !reason) {
      setError('All fields are required.');
      return;
    }

    try {
      await addDoc(collection(db, 'proxies'), {
        requester: requester.trim().toLowerCase(),
        delegate: delegate.trim().toLowerCase(),
        reason: reason.trim(),
        timestamp: Timestamp.now(),
      });
      setSuccess('Proxy request submitted successfully!');
      setRequester('');
      setDelegate('');
      setReason('');
      setQrVerified(false);
    } catch (err) {
      setError('Error submitting proxy: ' + err.message);
    }
  };

  return (
      <div className="student-container">
        {!embeddedFromHome && <h2 className="student-title">Submit a Proxy Request</h2>}

        {!qrVerified && expectedCode ? (
            <div>
              <p>Scan the QR code to proceed:</p>
              <video ref={videoRef} style={{ width: '100%', maxWidth: '500px' }} />
              {error && <p className="error">{error}</p>}
            </div>
        ) : qrVerified ? (
            <form className="vote-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Your Username (requester)</label>
                <input
                    type="text"
                    value={requester}
                    onChange={(e) => setRequester(e.target.value)}
                    required
                />
              </div>

              <div className="input-group">
                <label>Who is Voting for You (delegate)</label>
                <input
                    type="text"
                    value={delegate}
                    onChange={(e) => setDelegate(e.target.value)}
                    required
                />
              </div>

              <div className="input-group">
                <label>Reason for Proxy</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" className="admin-btn">
                Submit Proxy
              </button>
            </form>
        ) : (
            !expectedCode && <p>No open attendance session or QR code found.</p>
        )}
      </div>
  );
};

export default ProxyRequest;
