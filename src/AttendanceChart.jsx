import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import './AttendanceChart.css';

const AttendanceChart = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth !== 'true') {
      navigate('/'); // Redirect to login if not authenticated
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      // 1️⃣ Fetch sessions
      const sessSnap = await getDocs(collection(db, 'attendanceSessions'));
      const sessData = sessSnap.docs
        .map(docSnap => {
          const data = docSnap.data();
          // prefer a real Timestamp in `date`, fall back to `createdAt`
          const raw = data.date ?? data.createdAt;
          const dateObj = raw?.toDate
            ? raw.toDate()
            : new Date(raw);
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
        absences: docSnap.data().absences || 0, // Fetch absences directly
        attendance: docSnap.data().attendance || [],
        ...docSnap.data()
      }));
      setUsers(userData);
    };

    fetchAll();
  }, []);

  const resetAllAbsences = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all users' absences to 0?"
    );
    if (!confirmReset) return;

    try {
      const userSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);

      userSnap.docs.forEach(doc => {
        batch.update(doc.ref, { absences: 0 });
      });

      await batch.commit();
      alert("All users' absences have been reset to 0.");
      window.location.reload(); // Refresh the page to update the chart
    } catch (error) {
      console.error("Error resetting absences:", error);
      alert("Failed to reset absences. Please try again.");
    }
  };

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">Attendance Chart</h2>
      <button
        className="admin-btn reset-btn"
        onClick={resetAllAbsences}
        style={{ float: 'right', marginBottom: '1rem' }}
      >
        Reset Absences
      </button>
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
                <th key={sess.id}>{sess.date.toLocaleDateString()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              // choose color class based on absences
              let nameClass = '';
              if (user.absences <= 1) nameClass = 'absences-green';
              else if (user.absences === 2) nameClass = 'absences-yellow';
              else nameClass = 'absences-red';

              return (
                <tr key={user.id}>
                  <td className={`name-cell ${nameClass}`}>
                    {user.id} ({user.absences}) {/* Display absences */}
                  </td>
                  {sessions.map(sess => {
                    const present = user.attendance.includes(sess.id);
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceChart;
