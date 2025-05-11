import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';
import QRScanner from './QRScanner';
import QRCodeGenerator from './QRCodeGenerator';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/qr" element={<QRScanner />} />
                <Route path="/generate" element={<QRCodeGenerator />} />
            </Routes>
        </Router>
    );
}

export default App;
