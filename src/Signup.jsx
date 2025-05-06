import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import './StudentInterface.css';

// Firebase configuration (same as voting app)
const firebaseConfig = {
  apiKey: "AIzaSyCEGCSkc0mSAvn4mB5mQXTTDZ3GcEScHWg",
  authDomain: "attendance-f524b.firebaseapp.com",
  projectId: "attendance-f524b",
  storageBucket: "attendance-f524b.firebasestorage.app",
  messagingSenderId: "295378375527",
  appId: "1:295378375527:web:ac2b55cb9a917ba87c55c2",
  measurementId: "G-124MCMCKTR"
};

initializeApp(firebaseConfig);
const auth = getAuth();

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Use a fake email alias for Firebase Auth
    const email = `${username}@stuco.local`;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Account created successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="student-container">
      <h2 className="student-title">Sign Up</h2>
      <form className="vote-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            placeholder='DO NOT INCLUDE @exeter.edu'
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group" style={{ position: 'relative' }}>
          <label>Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              cursor: 'pointer'
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <div className="input-group" style={{ position: 'relative' }}>
          <label>Confirm Password</label>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowConfirm(v => !v)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              cursor: 'pointer'
            }}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? '🙈' : '👁️'}
          </span>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button type="submit">Confirm</button>
      </form>
    </div>
  );
};

export default Signup;
