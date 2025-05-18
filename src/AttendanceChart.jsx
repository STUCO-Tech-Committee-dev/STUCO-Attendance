// AttendanceChart.js
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
import { parseCSV } from './electedMembers';

const loadNameMapFromCSV = async () => {
    const parsed = await parseCSV();
    const nameMap = {};
    for (const [username, data] of Object.entries(parsed)) {
        nameMap[username] = data.name;
    }
    return nameMap;
};

const AttendanceChart = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [nameMap, setNameMap] = useState({});

    // Auth check
    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth !== 'true') {
            navigate('/');
        }
    }, [navigate]);

    // Load data on mount
    useEffect(() => {
        const fetchAll = async () => {
            const [sessSnap, userSnap, nameMapping] = await Promise.all([
                getDocs(collection(db, 'attendanceSessions')),
                getDocs(collection(db, 'users')),
                loadNameMapFromCSV(),
            ]);

            setNameMap(nameMapping);

            const sessions = sessSnap.docs
                .map((docSnap) => {
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

            setSessions(sessions);

            const users = userSnap.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    username: data.username || docSnap.id,
                    absences: data.absences || 0,
                    attendance: data.attendance || [],
                };
            });

            setUsers(users);
        };

        fetchAll();
    }, []);

    const resetAllAbsences = async () => {
        if (!window.confirm("Reset all users' absences to 0?")) return;
        try {
            const userSnap = await getDocs(collection(db, 'users'));
            const batch = writeBatch(db);

            userSnap.docs.forEach((docSnap) => {
                if ((docSnap.data().absences || 0) !== 0) {
                    batch.update(docSnap.ref, { absences: 0 });
                }
            });

            await batch.commit();
            alert('Absences reset successfully.');
            window.location.reload();
        } catch (err) {
            console.error('Reset error:', err);
            alert('Failed to reset absences.');
        }
    };

    const handleSessionEdit = async (user, sessionId) => {
        const adminUsername = localStorage.getItem('username') || 'Unknown Admin';
        const existing = user.attendance.find((a) => a.startsWith(sessionId));
        const defaultVal = existing?.includes('(Proxy)')
            ? 'proxy'
            : existing === sessionId
                ? 'present'
                : 'absent';

        const newStatus = prompt(
            `Update attendance for ${user.username} on session ${sessionId}:\n- present\n- absent\n- proxy`,
            defaultVal
        );
        if (!newStatus) return;

        const updatedAttendance = user.attendance.filter((a) => !a.startsWith(sessionId));
        if (newStatus === 'present') {
            updatedAttendance.push(sessionId);
        } else if (newStatus === 'proxy') {
            updatedAttendance.push(`${sessionId}(Proxy)`);
        }

        const attended = new Set(updatedAttendance.map((a) => a.replace('(Proxy)', '')));
        const recalculatedAbsences = sessions.filter((s) => !attended.has(s.id)).length;

        try {
            await updateDoc(doc(db, 'users', user.id), {
                attendance: updatedAttendance,
                absences: recalculatedAbsences,
            });

            await addDoc(collection(db, 'manualEdits'), {
                userId: user.id,
                username: user.username || 'Unknown',
                adminUsername,
                sessionId,
                timestamp: new Date().toISOString(),
                description: `Admin (${adminUsername}) set ${user.username} to "${newStatus}" for session ${sessionId}`,
            });

            setUsers((prev) =>
                prev.map((u) =>
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
            console.error('Failed to update:', err);
            alert('Update failed.');
        }
    };

    const resolveDisplayName = (username, fallback) => {
        const cleanUsername = username?.toLowerCase();
        const name = nameMap[cleanUsername];
        return name ? `${name} (${username})` : fallback;
    };

    const formatDate = (date) =>
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
                style={{ marginBottom: '1rem', display: 'block', margin: '0 auto' }}
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

            <button className="admin-btn back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <div className="attendance-table-wrapper">
                <table className="attendance-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        {sessions.map((s) => (
                            <th key={s.id}>{formatDate(s.date)}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => {
                        const displayName = resolveDisplayName(user.username, user.username);
                        const colorClass =
                            user.absences <= 1
                                ? 'absences-green'
                                : user.absences === 2
                                    ? 'absences-yellow'
                                    : 'absences-red';

                        return (
                            <tr key={user.id}>
                                <td className={`name-cell ${colorClass}`}>
                                    {displayName} ({user.absences})
                                </td>
                                {sessions.map((s) => {
                                    const att = user.attendance.find((a) => a.startsWith(s.id));
                                    const isProxy = att?.includes('(Proxy)');
                                    const isPresent = att === s.id;

                                    let status = 'Absent';
                                    if (isProxy) status = 'Proxy';
                                    else if (isPresent) status = 'Present';

                                    const className = isProxy
                                        ? 'proxy'
                                        : isPresent
                                            ? 'present'
                                            : 'absent';

                                    return (
                                        <td
                                            key={s.id}
                                            className={className}
                                            title="Click to edit"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSessionEdit(user, s.id)}
                                        >
                                            {status}
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
