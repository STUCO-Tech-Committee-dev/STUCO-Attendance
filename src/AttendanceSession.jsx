// src/AttendanceSession.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  writeBatch, addDoc,
} from 'firebase/firestore';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { db } from './firebase';
import './AdminInterface.css';

const AttendanceSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  // load the session document
  useEffect(() => {
    const loadSession = async () => {
      const snap = await getDoc(doc(db, 'attendanceSessions', sessionId));
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() });
      } else {
        alert('Session not found');
        navigate('/admin');
      }
    };
    loadSession();
  }, [sessionId, navigate]);

  const endSession = async () => {
    const batch = writeBatch(db);
    const edits = [];

    const sessRef = doc(db, 'attendanceSessions', sessionId);
    batch.update(sessRef, { open: false });

    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(userDoc => {
      const data = userDoc.data();
      const wasPresent = data.attendance?.includes(sessionId);
      const currentAbsences = data.absences || 0;
      const newAbsences = wasPresent ? currentAbsences : currentAbsences + 1;

      if (!wasPresent) {
        edits.push({
          userId: userDoc.id,
          username: data.username || "Unknown",
          adminUsername: localStorage.getItem('username') || 'System',
          timestamp: new Date().toISOString(),
          description: `Marked absent for session ${sessionId}. Absences incremented to ${newAbsences}`
        });
      }

      const userRef = doc(db, 'users', userDoc.id);
      batch.update(userRef, { absences: newAbsences });
    });

    await batch.commit();

    // Log all absences from this session
    for (const edit of edits) {
      await addDoc(collection(db, 'manualEdits'), edit);
    }

    setSession(prev => ({ ...prev, open: false }));
  };

  // abort session: delete the session and remove it from users' attendance
  const abortSession = async () => {
    const batch = writeBatch(db);

    // delete the session
    const sessRef = doc(db, 'attendanceSessions', sessionId);
    batch.delete(sessRef);

    // fetch all users
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(userDoc => {
      const data = userDoc.data();
      const updatedAttendance = data.attendance?.filter(id => id !== sessionId) || [];

      const userRef = doc(db, 'users', userDoc.id);
      batch.update(userRef, { attendance: updatedAttendance });
    });

    // commit batch
    await batch.commit();

    // navigate back to admin dashboard
    navigate('/admin');
  };

  if (!session) return <div>Loading…</div>;

  // helper to format Firestore Timestamp or raw number
  const formatDate = (ts) =>
    ts?.toDate
      ? ts.toDate().toLocaleString("en-US", { timeZone: "America/New_York" })
      : new Date(ts).toLocaleString("en-US", { timeZone: "America/New_York" });

  return (
    <div className="admin-container">
      <button
        className="admin-btn"
        style={{ marginBottom: '1rem' }}
        onClick={() => navigate('/admin')}
      >
        ← Back to Dashboard
      </button>

      <h2 className="admin-title">Today's Attendance Session</h2>

      {session.open ? (
        <div className="qr-container">
          <QRCode value={sessionId} size={256} />
          <div className="qr-value">
            <strong>Session ID:</strong> {sessionId}
            <br />
            <strong>Started:</strong> {formatDate(session.createdAt)}
          </div>
          <button className="admin-btn" onClick={() => {
            if (window.confirm("Are you sure you want to end the session? All who have not scanned the QR code will receive an absence.")) {
              endSession();
            }
          }}>
            End Session
          </button>
          <button
            className="admin-btn"
            style={{ marginTop: '1.5rem' }} // Added spacing between buttons
            onClick={() => {
              if (window.confirm("Are you sure you want to abort the session?")) {
                abortSession();
              }
            }}
          >
            Abort Session
          </button>
        </div>
      ) : (
        <div className="input-group" style={{ flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            This session has ended.
          </div>
          <button
            className="admin-btn"
            onClick={() => navigate('/admin')}
          >
            ← Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceSession;
