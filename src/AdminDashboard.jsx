import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminInterface.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc} from 'firebase/firestore';
import { adminPassword } from './adminAuth'; // Import the password

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [passwordInput, setPasswordInput] = useState(''); // Input for password
  const [usernameInput, setUsernameInput] = useState(''); // Input for admin username
  const [error, setError] = useState(''); // Error message for incorrect password
  const [proxyRequests, setProxyRequests] = useState([]); // State for proxy requests
  const [approvedProxies, setApprovedProxies] = useState([]); // State for approved proxies

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUsernameInput(localStorage.getItem('username') || ''); // Restore username
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

  useEffect(() => {
    if (isAuthenticated) {
      const loadProxyRequests = async () => {
        const snap = await getDocs(collection(db, 'proxyRequests'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProxyRequests(data);
      };
      loadProxyRequests();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadApprovedProxies = async () => {
        const snap = await getDocs(collection(db, 'approvedRequests'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApprovedProxies(data);
      };
      loadApprovedProxies();
    }
  }, [isAuthenticated]);

  // Find the currently open session, if any
  const currentSession = sessions.find(s => s.open);

  const startSession = async () => {
    if (currentSession) return;
    const confirmStart = window.confirm("Careful! Are you sure you want to start a session?");
    if (!confirmStart) return;

    const newDoc = await addDoc(collection(db, 'attendanceSessions'), {
      createdAt: serverTimestamp(),
      open: true,
      date: new Date().toISOString().split('T')[0] // Add the current date
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
      localStorage.setItem('isAuthenticated', 'true'); // Save to localStorage
      localStorage.setItem('username', usernameInput || 'Unknown Admin'); // Save admin username
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleAccept = async (request) => {
    try {
      const requestRef = doc(db, 'proxyRequests', request.id);
      const approvedRef = collection(db, 'approvedRequests');

      // Add the request to the approvedRequests collection
      await addDoc(approvedRef, { ...request, approvedAt: serverTimestamp() });

      // Remove the request from the proxyRequests collection
      await deleteDoc(requestRef);

      setProxyRequests((prev) => prev.filter((r) => r.id !== request.id));
      setApprovedProxies((prev) => [...prev, { ...request, approved: true }]);
      alert('Proxy request accepted.');
    } catch (error) {
      console.error('Error accepting proxy request:', error);
      alert('Failed to accept proxy request.');
    }
  };

  const handleReject = async (request) => {
    try {
      await deleteDoc(doc(db, 'proxyRequests', request.id));
      alert('Proxy request rejected.');
      setProxyRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting proxy request:', error);
      alert('Failed to reject proxy request.');
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h2 className="admin-title">Admin Login</h2>
        <div className="input-group" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter Admin Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="admin-input styled-input"
          />
        </div>
        <div className="input-group" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="admin-input styled-input"
          />
          <button className="admin-btn styled-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
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

      <div className="proxy-requests-container">
        <h3>Proxy Requests</h3>
        {proxyRequests.map((request) => (
          <div key={request.id} className="proxy-request-bubble">
            <p><strong>Date:</strong> {new Date(request.date).toLocaleDateString()}</p>
            <p><strong>Name:</strong> {request.name}</p>
            <p><strong>Username:</strong> {request.username}</p>
            <p><strong>Chosen Proxy:</strong> {request.proxy}</p>
            <p><strong>Reason:</strong> {request.description}</p>
            <div className="proxy-actions">
              <button
                className="accept-btn"
                onClick={() => handleAccept(request)}
              >
                Accept
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(request)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="approved-proxies-container">
        <h3>Approved Proxy Requests</h3>
        {approvedProxies.map((proxy) => (
          <div key={proxy.id} className="proxy-request-bubble">
            <p><strong>Date:</strong> {new Date(proxy.date).toLocaleDateString()}</p>
            <p><strong>Name:</strong> {proxy.name}</p>
            <p><strong>Username:</strong> {proxy.username}</p>
            <p><strong>Chosen Proxy:</strong> {proxy.proxy}</p>
            <p><strong>Reason:</strong> {proxy.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;