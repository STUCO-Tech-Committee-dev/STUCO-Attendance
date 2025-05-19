import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import membersCSV from './ALL_ELECTED.csv';
import ProxyRequest from './ProxyRequest'; // 🔺 Import
import './StudentInterface.css';

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allowedMembers, setAllowedMembers] = useState({});
  const [showProxyForm, setShowProxyForm] = useState(false); // 🔺 New toggle
  const navigate = useNavigate();

  const parseCSV = async () => {
    try {
      const text = await fetch(membersCSV).then((r) => r.text());
      const lines = text.trim().split('\n').slice(1);
      const data = {};
      lines.forEach((line) => {
        const [name, usernameCSV] = line.split(',');
        if (!usernameCSV) return;
        const cleanUsername = usernameCSV.trim().toLowerCase();
        data[cleanUsername] = {
          username: cleanUsername,
          name: name.trim(),
        };
      });
      return data;
    } catch (err) {
      console.error('Failed to parse CSV:', err);
      return {};
    }
  };

  useEffect(() => {
    parseCSV().then(setAllowedMembers);
  }, []);

  const emailFromUsername = (u) => `${u.trim().toLowerCase()}@stuco.local`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }
    const email = emailFromUsername(cleanUsername);
    if (mode === 'signup') {
      if (!(cleanUsername in allowedMembers)) {
        setError('This username is not in the elected members list.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cleanUsername), {
          absences: 0,
          attendance: [],
          username: cleanUsername,
          name: allowedMembers[cleanUsername]?.name || '',
        });
        setSuccess('Account created! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Logged in! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
      <div className="student-container">
        <h2 className="student-title">
          {showProxyForm ? 'Submit Proxy Request' : mode === 'login' ? 'Student Login' : 'Sign Up'}
        </h2>

        <div style={{ marginBottom: 16 }}>
          <button className="link-btn" onClick={() => setShowProxyForm(!showProxyForm)}>
            {showProxyForm ? '← Back to Login/Signup' : 'Submit a Proxy Instead'}
          </button>
        </div>

        {showProxyForm ? (
            <ProxyRequest embeddedFromHome={true} />
        ) : (
            <form className="vote-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    placeholder="official exeter username, no @exeter.edu"
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={!!success}
                />
              </div>
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Password</label>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!!success}
                />
                <span onClick={() => setShowPassword((v) => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer',
                }}>
              {showPassword ? '🙈' : '👁️'}
            </span>
              </div>

              {mode === 'signup' && (
                  <div className="input-group" style={{ position: 'relative' }}>
                    <label>Confirm Password</label>
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={!!success}
                    />
                    <span onClick={() => setShowConfirm((v) => !v)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer',
                    }}>
                {showConfirm ? '🙈' : '👁️'}
              </span>
                  </div>
              )}

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" className="admin-btn">
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>
        )}

        {!showProxyForm && (
            <div style={{ marginTop: 16 }}>
              {mode === 'login' ? (
                  <>
                    <span style={{ color: 'white' }}>Need an account? </span>
                    <button className="link-btn" onClick={() => {
                      setMode('signup'); setError(''); setSuccess('');
                    }}>Sign Up</button>
                  </>
              ) : (
                  <>
                    <span style={{ color: 'white' }}>Already have one? </span>
                    <button className="link-btn" onClick={() => {
                      setMode('login'); setError(''); setSuccess('');
                    }}>Log In</button>
                  </>
              )}
            </div>
        )}
      </div>
  );
};

export default AuthPage;
