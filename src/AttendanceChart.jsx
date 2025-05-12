import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AttendanceChart.css';

const AttendanceChart = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      // 1️⃣ Fetch sessions
      const sessSnap = await getDocs(collection(db, 'attendanceSessions'));
      const sessData = sessSnap.docs
        .map(docSnap => {
          const data = docSnap.data();
          // prefer a real Timestamp in `date`, fall back to `createdAt`
          const raw = data.date ?? data.createdAt;
          const dateObj =
            raw?.toDate   // Firestore Timestamp?
              ? raw.toDate()
              : new Date(raw); // JS millisecond timestamp
          return {
            id: docSnap.id,
            date: dateObj,
            ...data
          };
        })
        .sort((a, b) => a.date - b.date);
      setSessions(sessData);

      // 2️⃣ Fetch users
      const userSnap = await getDocs(collection(db, 'users'));
      const userData = userSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setUsers(userData);
    };

    fetchAll();
  }, []);

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">Attendance Chart</h2>
      <button
        className="admin-btn back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              {sessions.map(sess => (
                <th key={sess.id}>
                  {sess.date.toLocaleDateString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="name-cell">{user.id}</td>
                {sessions.map(sess => {
                  const present = user.attendance?.includes(sess.id);
                  return (
                    <td
                      key={sess.id}
                      className={present ? 'present' : 'absent'}
                    >
                      {present ? 'Present' : 'Absent'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceChart;
