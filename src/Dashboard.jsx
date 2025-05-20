// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';

const Dashboard = () => {
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [absences, setAbsences] = useState(0);
  const [username, setUsername] = useState('');
  const [hasOpenSession, setHasOpenSession] = useState(false);
  const navigate = useNavigate();

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    }).format(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Redirect if not logged in
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      const email = auth.currentUser.email;
      const uname = email.split('@')[0];
      setUsername(uname);

      // 1️⃣ Load user record
      const userRef = doc(db, 'users', uname);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setAbsences(userData.absences ?? 0);
        const sessionIds = userData.attendance || [];

        // fetch each session's date
        const dates = await Promise.all(
          sessionIds.map(async sessionId => {
            const sessSnap = await getDoc(doc(db, 'attendanceSessions', sessionId));
            if (!sessSnap.exists()) return null;
            const sessData = sessSnap.data();
            const raw = sessData.date ?? sessData.createdAt;

            // Ensure raw is converted to a Date object
            return raw instanceof Date
              ? raw
              : typeof raw?.toDate === 'function'
              ? raw.toDate()
              : new Date(raw);
          })
        );

        setAttendanceDates(
          dates
            .filter(d => d instanceof Date && !isNaN(d))
            .sort((a, b) => a - b)
        );
      } else {
        // no user record → zero out
        setAbsences(0);
        setAttendanceDates([]);
      }

      // 2️⃣ Check for an active session
      const q = query(
        collection(db, 'attendanceSessions'),
        where('open', '==', true)
      );
      const sessSnap = await getDocs(q);
      setHasOpenSession(!sessSnap.empty);
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <div className="admin-container">
      <button
        className="logout-btn"
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Log Out
      </button>

      <h2 className="admin-title">Welcome, {username}</h2>

      <p>Total Absences: {absences}</p>

      <h3>Attendance Record:</h3>
      {attendanceDates.length ? (
        <ul className="attendance-list">
          {attendanceDates.map((date, idx) => (
            <li key={idx}>{formatDate(date)}</li>
          ))}
        </ul>
      ) : (
        <p>No attendance records yet.</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          className="admin-btn"
          onClick={() => navigate('/qr')}
          disabled={!hasOpenSession}
          title={
            hasOpenSession
              ? 'Scan QR to Check In'
              : 'No active attendance session right now'
          }
        >
          Scan QR to Check In
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
