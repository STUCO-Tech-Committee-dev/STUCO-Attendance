import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { adminPassword } from './adminAuth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUsernameInput(localStorage.getItem('username') || '');
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

  const currentSession = sessions.find(s => s.open);

  const startSession = async () => {
    if (currentSession) return;
    const confirmStart = window.confirm("Careful! Are you sure you want to start a session?");
    if (!confirmStart) return;

    const newDoc = await addDoc(collection(db, 'attendanceSessions'), {
      createdAt: serverTimestamp(),
      open: true,
      date: new Date().toISOString().split('T')[0]
    });
    navigate(`/attendance/session/${newDoc.id}`);
  };

  const goToCurrentSession = () => {
    if (!currentSession) return;
    navigate(`/attendance/session/${currentSession.id}`);
  };

  const handleLogin = () => {
    if (passwordInput === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', usernameInput || 'Unknown Admin');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="login-container">
          <h2 className="admin-title">Admin Login</h2>
          <div className="input-group">
            <input
                type="text"
                placeholder="Admin Name"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="admin-input styled-input"
            />
          </div>
          <div className="input-group">
            <input
                type="password"
                placeholder="Enter Admin Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="admin-input styled-input"
            />
          </div>
          <div className="button-group">
            <button className="admin-btn styled-btn" onClick={handleLogin}>
              Login
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
    );
  }

  return (
      <div className="admin-container">
        <h2 className="admin-title">Admin Dashboard</h2>

        <div className="dashboard-group">
          <button className="admin-btn styled-btn" onClick={startSession} disabled={!!currentSession}>
            {currentSession ? 'Session In Progress' : 'Start New Session'}
          </button>
          {currentSession && (
              <button className="admin-btn styled-btn" onClick={goToCurrentSession}>
                Go to Current Session
              </button>
          )}
        </div>

        <div className="dashboard-group">
          <button className="admin-btn styled-btn" onClick={() => navigate('/attendance/chart')}>
            View Total Attendance
          </button>
        </div>

        <div className="dashboard-group">
          <button className="admin-btn styled-btn" onClick={() => navigate('/admin/proxies')}>
            Manage Proxy Requests
          </button>
        </div>
      </div>
  );
};

export default AdminDashboard;