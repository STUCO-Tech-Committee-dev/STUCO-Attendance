// src/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase'; // ✅ correct usage

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const email = `${username}@stuco.local`;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err.message);
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="login-container">
            <h2>Student Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (no @exeter.edu)"
                    required
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Password"
                    required
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Log In</button>
            </form>
            <button onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
    );
};

export default Login;
