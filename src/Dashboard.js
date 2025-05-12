// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';

const Dashboard = () => {
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [absences, setAbsences] = useState(0);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // redirect if not logged in
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      const email = auth.currentUser.email;
      const uname = email.split('@')[0];
      setUsername(uname);

      // get the user doc
      const userRef = doc(db, 'users', uname);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // no user record → treat as zero
        setAbsences(0);
        setAttendanceDates([]);
        return;
      }

      const userData = userSnap.data();
      setAbsences(userData.absences ?? 0);
      const sessionIds = userData.attendance || [];

      // fetch each session to get its date
      const dates = await Promise.all(
        sessionIds.map(async sessionId => {
          const sessRef = doc(db, 'attendanceSessions', sessionId);
          const sessSnap = await getDoc(sessRef);
          if (!sessSnap.exists()) return null;

          const sessData = sessSnap.data();
          // session.date if you used serverTimestamp(), otherwise fall back to createdAt
          const raw = sessData.date ?? sessData.createdAt;
          const dateObj =
            typeof raw?.toDate === 'function'
              ? raw.toDate()
              : new Date(raw);
          return dateObj;
        })
      );

      // filter out any nulls and sort chronologically
      setAttendanceDates(
        dates
          .filter(d => d instanceof Date && !isNaN(d))
          .sort((a, b) => a - b)
      );
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="admin-container">
      <h2 className="admin-title">Welcome, {username}</h2>

      <p>Total Absences: {absences}</p>

      <h3>Attendance Record:</h3>
      {attendanceDates.length ? (
        <ul className="attendance-list">
          {attendanceDates.map((date, idx) => (
            <li key={idx}>{date.toLocaleDateString()}</li>
          ))}
        </ul>
      ) : (
        <p>No attendance records yet.</p>
      )}

      <button
        className="admin-btn"
        onClick={() => navigate('/qr')}
      >
        Scan QR to Check In
      </button>
    </div>
  );
};

export default Dashboard;
