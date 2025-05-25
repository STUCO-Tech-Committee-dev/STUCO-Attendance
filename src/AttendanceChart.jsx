import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import {
  collection,
  getDocs,
  writeBatch,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import './AttendanceChart.css';

const AttendanceChart = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);

  const formatDateSafely = (dateStr) => {
    // Handle "YYYY-MM-DD" without time zone shift
    const [year, month, day] = dateStr.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));

    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York", // Optional, helps ensure consistency
    });
  };


  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth !== 'true') navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      const sessSnap = await getDocs(collection(db, 'attendanceSessions'));
      const sessData = sessSnap.docs
          .map(docSnap => {
            const data = docSnap.data();
            const raw = data.date ?? data.createdAt;
            const dateObj = raw instanceof Date
                ? raw
                : typeof raw?.toDate === 'function'
                    ? raw.toDate()
                    : new Date(raw);
            return {
              id: docSnap.id,
              date: isNaN(dateObj) ? null : dateObj,
              ...data
            };
          })
          .sort((a, b) => (a.date && b.date ? a.date - b.date : 0));
      setSessions(sessData);

      const userSnap = await getDocs(collection(db, 'users'));
      const userData = userSnap.docs.map(docSnap => ({
        id: docSnap.id,
        absences: docSnap.data().absences || 0,
        attendance: docSnap.data().attendance || [],
        ...docSnap.data()
      }));
      setUsers(userData);
    };

    fetchAll();
  }, []);

  const resetAllAbsences = async () => {
    if (!window.confirm("Reset all users' absences to 0?")) return;

    try {
      const userSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      userSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.absences !== 0) batch.update(doc.ref, { absences: 0 });
      });
      await batch.commit();
      alert("All absences reset.");
      window.location.reload();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to reset.");
    }
  };

  const handleEdit = async (user) => {
    const newAbs = prompt(`Edit absences for ${user.username || user.id}:`, user.absences);
    if (newAbs === null || isNaN(newAbs)) return;

    try {
      const absences = parseInt(newAbs);
      await updateDoc(doc(db, 'users', user.id), { absences });
      await addDoc(collection(db, 'manualEdits'), {
        userId: user.id,
        username: user.username || "Unknown",
        adminUsername: localStorage.getItem('username') || 'Unknown Admin',
        timestamp: new Date().toISOString(),
        description: `Manual absences edit to ${absences}`,
      });
      setUsers(prev =>
          prev.map(u => (u.id === user.id ? { ...u, absences } : u))
      );
      alert("Updated.");
    } catch (err) {
      console.error("Error updating absences:", err);
      alert("Failed.");
    }
  };

  const updateAttendance = async (userId, sessionId, value) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    let updatedAttendance = user.attendance.filter(a => !a.startsWith(sessionId));
    if (value === 'present') updatedAttendance.push(sessionId);
    if (value === 'proxy') updatedAttendance.push(`${sessionId} proxy`);

    // Recalculate absences
    const totalSessions = sessions.length;
    const attendedSessions = updatedAttendance.filter(a =>
        sessions.some(s => a.startsWith(s.id))
    ).length;
    const actualAbsences = totalSessions - attendedSessions;

    try {
      await updateDoc(doc(db, 'users', userId), {
        attendance: updatedAttendance,
        absences: actualAbsences
      });

      await addDoc(collection(db, 'manualEdits'), {
        userId,
        username: user.username || "Unknown",
        adminUsername: localStorage.getItem('username') || 'Unknown Admin',
        timestamp: new Date().toISOString(),
        description: `Changed attendance for session ${sessionId} to ${value}`
      });

      setUsers(prev =>
          prev.map(u =>
              u.id === userId
                  ? { ...u, attendance: updatedAttendance, absences: actualAbsences }
                  : u
          )
      );
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to update.");
    }
  };

  return (
      <div className="attendance-container">
        <h2 className="attendance-title">Attendance Chart</h2>

        <button
            className="admin-btn log-btn"
            onClick={() => navigate('/edit-logs')}
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
            style={{ marginBottom: '1rem' }}
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
                    {sess.date ? formatDateSafely(sess.date) : "Invalid Date"}
                  </th>
              ))}
            </tr>
            </thead>
            <tbody>
            {users.map(user => {
              let nameClass =
                  user.absences <= 1 ? 'absences-green' :
                      user.absences === 2 ? 'absences-yellow' :
                          'absences-red';

              return (
                  <tr key={user.id}>
                    <td className={`name-cell ${nameClass}`}>
                      {user.id} ({user.absences})
                      <button
                          className="edit-btn"
                          onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                    </td>
                    {sessions.map(sess => {
                      const current = user.attendance.find(a => a.startsWith(sess.id));
                      const value = current?.includes('proxy')
                          ? 'proxy'
                          : current === sess.id
                              ? 'present'
                              : 'absent';

                      return (
                          <td key={sess.id}>
                            <select
                                value={value}
                                onChange={(e) =>
                                    updateAttendance(user.id, sess.id, e.target.value)
                                }
                                className={`select-attendance ${value}`}
                            >
                              <option value="present">Present</option>
                              <option value="proxy">Proxy</option>
                              <option value="absent">Absent</option>
                            </select>
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
