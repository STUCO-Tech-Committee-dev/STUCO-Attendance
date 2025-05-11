import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import './StudentInterface.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const email = `${username}@stuco.local`;

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // Create Firestore doc for user
      await setDoc(doc(db, 'users', username), {
        absences: 0,
        attendance: []
      });

      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);
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
                placeholder="DO NOT INCLUDE @exeter.edu"
                onChange={(e) => setUsername(e.target.value)}
                required
            />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <span
                onClick={() => setShowPassword((v) => !v)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <span
                onClick={() => setShowConfirm((v) => !v)}
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

          <button type="submit">Create Account</button>
          <button type="button" onClick={() => navigate('/')}>Back to Login</button>
        </form>
      </div>
  );
};

export default Signup;