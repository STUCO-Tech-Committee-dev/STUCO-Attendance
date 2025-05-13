import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc } from 'firebase/firestore';
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
        const userData = doc.data();
        if (userData.absences !== 0) { // Only reset if absences are not already 0
          batch.update(doc.ref, { absences: 0 });
        }
      });

      await batch.commit();
      alert("All users' absences have been reset to 0.");
      window.location.reload(); // Refresh the page to update the chart
    } catch (error) {
      console.error("Error resetting absences:", error);
      alert("Failed to reset absences. Please try again.");
    }
  };

  const handleEdit = async (user) => {
    const adminUsername = localStorage.getItem('username') || 'Unknown Admin'; // Get admin username
    const newAbsences = prompt(
      `Edit absences for ${user.username || user.id}:`,
      user.absences
    );
    if (newAbsences === null || isNaN(newAbsences)) return;

    try {
      const absencesNumber = parseInt(newAbsences, 10);
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { absences: absencesNumber });

      const editLog = {
        userId: user.id,
        username: user.username || "Unknown",
        adminUsername, // Log the admin username
        timestamp: new Date().toISOString(), // Use ISO string for consistent formatting
        description: `Admin (${adminUsername}) updated absences for user ${user.id} (${user.username || "Unknown"}) to ${absencesNumber}.`
      };
      await addDoc(collection(db, 'manualEdits'), editLog);

      alert("Absences updated and edit logged successfully.");
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, absences: absencesNumber } : u
        )
      );
    } catch (error) {
      console.error("Error updating absences:", error);
      alert("Failed to update absences. Please try again.");
    }
  };

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">Attendance Chart</h2>
      <button
        className="admin-btn log-btn"
        onClick={() => navigate('/edit-logs')}
        style={{ float: 'none', marginBottom: '1rem', display: 'block', margin: '0 auto' }}
      >
        View Edit Logs
      </button>
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
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(user)}
                      style={{
                        float: 'right', // Align to the right
                        background: 'none', // Subtle styling
                        border: 'none',
                        color: '#007BFF', // Theme color
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.9rem'
                      }}
                    >
                      Edit
                    </button>
                  </td>
                  {sessions.map(sess => {
                    const attendanceValue = user.attendance.find(a => a.startsWith(sess.id));
                    const isProxy = attendanceValue?.includes('(Proxy)');
                    const present = attendanceValue === sess.id;

                    return (
                      <td
                        key={sess.id}
                        className={isProxy ? 'proxy' : present ? 'present' : 'absent'}
                        style={isProxy ? { color: 'yellow' } : {}}
                      >
                        {isProxy ? '(Proxy)' : present ? 'Present' : 'Absent'}
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
