import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import AttendanceChart from './AttendanceChart';
import AttendanceSession from './AttendanceSession';
import ScanQRCode from './ScanQRCode';
import ResetPassword from './ResetPassword';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/" element={<AuthPage/>} />
                <Route path="/signup" element={<AuthPage/>} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/attendance/chart" element={<AttendanceChart />} />
                <Route path="/attendance/session/:sessionId" element={<AttendanceSession />} />
                <Route path="/qr" element={<ScanQRCode />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
        </Router>
    );
}

export default App;
