import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import AttendanceChart from "./AttendanceChart";
import AttendanceSession from "./AttendanceSession";
import ScanQRCode from "./ScanQRCode";
import EditLogs from "./EditLogs";
import ProxyRequest from "./ProxyRequest";
import ProxyManagement from './ProxyManagement';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<AdminDashboard/>}/>
                <Route path="/" element={<AuthPage/>}/>
                <Route path="/signup" element={<AuthPage/>}/>
                <Route path="/dashboard" element={<Dashboard/>}/>
                <Route path="/attendance/chart" element={<AttendanceChart/>}/>
                <Route
                    path="/attendance/session/:sessionId"
                    element={<AttendanceSession/>}
                />
                <Route path="/qr" element={<ScanQRCode/>}/>
                <Route path="/edit-logs" element={<EditLogs/>}/>
                <Route path="/proxy-request" element={<ProxyRequest/>}/>
                <Route path="/admin/proxies" element={<ProxyManagement />} />
            </Routes>
        </Router>
    );
}

export default App;
