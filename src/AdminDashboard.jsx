import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { adminPassword } from './adminAuth'; // Import the password

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [passwordInput, setPasswordInput] = useState(''); // Input for password
  const [error, setError] = useState(''); // Error message for incorrect password

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const load = async () => {
        const snap = await getDocs(collection(db, 'attendanceSessions'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessions(data);
      };
      load();
    }
  }, [isAuthenticated]);

  // Find the currently open session, if any
  const currentSession = sessions.find(s => s.open);

  const startSession = async () => {
    if (currentSession) return;
    // Show confirmation alert
    const confirmStart = window.confirm("Careful! Are you sure you want to start a session?");
    if (!confirmStart) return;

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

  const handleLogin = () => {
    if (passwordInput === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true'); // Save to localStorage
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h2 className="admin-title">Admin Login</h2>
        <div className="input-group" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="admin-input"
          />
          <button className="admin-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

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