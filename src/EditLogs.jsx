import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AttendanceChart.css';

const EditLogs = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsSnap = await getDocs(collection(db, 'manualEdits'));
        const logsData = logsSnap.docs
            .map(docSnap => docSnap.data())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching edit logs:", error);
      }
    };


    fetchLogs();
  }, []);

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">Edit Logs</h2>
      <button
        className="admin-btn back-btn"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
      >
        ← Back
      </button>
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Admin</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.userId}</td>
                <td>{log.adminUsername}</td>
                <td>{log.description}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditLogs;
