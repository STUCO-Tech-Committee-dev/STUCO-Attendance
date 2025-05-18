import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import {
    collection,
    getDocs,
    writeBatch,
    addDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import './AttendanceChart.css';

const AttendanceChart = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth !== 'true') {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchAll = async () => {
            const sessSnap = await getDocs(collection(db, 'attendanceSessions'));
            const sessData = sessSnap.docs
                .map(docSnap => {
                    const data = docSnap.data();
                    const raw = data.date ?? data.createdAt;
                    const dateObj =
                        raw instanceof Date
                            ? raw
                            : typeof raw?.toDate === 'function'
                                ? raw.toDate()
                                : new Date(raw);
                    return {
                        id: docSnap.id,
                        date: dateObj,
                        ...data,
                    };
                })
                .sort((a, b) => a.date - b.date);
            setSessions(sessData);

            const userSnap = await getDocs(collection(db, 'users'));
            const userData = userSnap.docs.map(docSnap => ({
                id: docSnap.id,
                absences: docSnap.data().absences || 0,
                attendance: docSnap.data().attendance || [],
                ...docSnap.data(),
            }));
            setUsers(userData);
        };

        fetchAll();
    }, []);

    const resetAllAbsences = async () => {
        const confirmReset = window.confirm("Are you sure you want to reset all users' absences to 0?");
        if (!confirmReset) return;

        try {
            const userSnap = await getDocs(collection(db, 'users'));
            const batch = writeBatch(db);

            userSnap.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.absences !== 0) {
                    batch.update(doc.ref, { absences: 0 });
                }
            });

            await batch.commit();
            alert("All users' absences have been reset to 0.");
            window.location.reload();
        } catch (error) {
            console.error("Error resetting absences:", error);
            alert("Failed to reset absences. Please try again.");
        }
    };

    const handleSessionEdit = async (user, sessionId) => {
        const adminUsername = localStorage.getItem('username') || 'Unknown Admin';

        const currentStatus = user.attendance.find(a => a.startsWith(sessionId));
        const newStatus = prompt(
            `Change attendance for ${user.username || user.id} on session ${sessionId}:\n\nType one of:\n- present\n- absent\n- proxy`,
            currentStatus?.includes('(Proxy)')
                ? 'proxy'
                : currentStatus === sessionId
                    ? 'present'
                    : 'absent'
        );

        if (!newStatus) return;

        // Build new attendance array
        let updatedAttendance = user.attendance.filter(a => !a.startsWith(sessionId));
        if (newStatus.toLowerCase() === 'present') {
            updatedAttendance.push(sessionId);
        } else if (newStatus.toLowerCase() === 'proxy') {
            updatedAttendance.push(`${sessionId}(Proxy)`);
        }

        // Recalculate absences:
        const attendedSessions = new Set(
            updatedAttendance.map(a => a.replace('(Proxy)', ''))
        );
        const recalculatedAbsences = sessions.filter(
            s => !attendedSessions.has(s.id)
        ).length;

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                attendance: updatedAttendance,
                absences: recalculatedAbsences,
            });

            await addDoc(collection(db, 'manualEdits'), {
                userId: user.id,
                username: user.username || 'Unknown',
                adminUsername,
                sessionId,
                timestamp: new Date().toISOString(),
                description: `Admin (${adminUsername}) updated attendance for session ${sessionId} to "${newStatus}" for user ${user.username || user.id}. Total absences now: ${recalculatedAbsences}`,
            });

            // Reflect changes locally
            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id
                        ? {
                            ...u,
                            attendance: updatedAttendance,
                            absences: recalculatedAbsences,
                        }
                        : u
                )
            );
        } catch (err) {
            console.error('Error editing session attendance:', err);
            alert('Failed to update attendance.');
        }
    };

    const formatDate = date =>
        date instanceof Date && !isNaN(date)
            ? date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })
            : 'Invalid Date';

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
                            <th key={sess.id}>{formatDate(sess.date)}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(user => {
                        let nameClass = '';
                        if (user.absences <= 1) nameClass = 'absences-green';
                        else if (user.absences === 2) nameClass = 'absences-yellow';
                        else nameClass = 'absences-red';

                        return (
                            <tr key={user.id}>
                                <td className={`name-cell ${nameClass}`}>
                                    {user.username || user.id} ({user.absences})
                                </td>
                                {sessions.map(sess => {
                                    const attendanceValue = user.attendance.find(a => a.startsWith(sess.id));
                                    const isProxy = attendanceValue?.includes('(Proxy)');
                                    const present = attendanceValue === sess.id;

                                    let statusText = 'Absent';
                                    if (isProxy) statusText = 'Proxy';
                                    else if (present) statusText = 'Present';

                                    const statusClass = isProxy ? 'proxy' : present ? 'present' : 'absent';

                                    return (
                                        <td
                                            key={sess.id}
                                            className={statusClass}
                                            onClick={() => handleSessionEdit(user, sess.id)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to edit"
                                        >
                                            {statusText}
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
