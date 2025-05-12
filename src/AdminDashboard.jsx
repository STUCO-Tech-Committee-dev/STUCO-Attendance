import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'attendanceSessions'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(data);
    };
    load();
  }, []);

  // Find the currently open session, if any
  const currentSession = sessions.find(s => s.open);

  const startSession = async () => {
    if (currentSession) return;
    // Create a new session
    const newDoc = await addDoc(collection(db, 'attendanceSessions'), {
      createdAt: serverTimestamp(),
      open: true
    });
    // Immediately navigate to its QR code page
    navigate(`/attendance/session/${newDoc.id}`);
  };

  const goToCurrentSession = () => {
    if (!currentSession) return;
    navigate(`/attendance/session/${currentSession.id}`);
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Dashboard</h2>
      <div className="input-group" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
        <button
          className="admin-btn"
          onClick={startSession}
          disabled={!!currentSession}
        >
          {currentSession ? 'Session In Progress' : '▶️ Start New Session'}
        </button>
        {currentSession && (
          <button className="admin-btn" onClick={goToCurrentSession}>
            ➡️ Go to Current Session
          </button>
        )}
      </div>

      <div className="input-group" style={{ justifyContent: 'center' }}>
        <button
          className="admin-btn"
          onClick={() => navigate('/attendance/chart')}
        >
          📊 View Total Attendance
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
