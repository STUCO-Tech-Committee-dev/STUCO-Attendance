import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const email = auth.currentUser?.email;
            const uname = email.split('@')[0];
            setUsername(uname);

            const docRef = doc(db, 'users', uname);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setData(docSnap.data());
            } else {
                setData({ absences: 0, attendance: [] });
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Welcome, {username}</h1>
            {data ? (
                <>
                    <p>Total Absences: {data.absences}</p>
                    <h3>Attendance Record:</h3>
                    <ul>
                        {data.attendance.map((entry, index) => (
                            <li key={index}>{entry}</li>
                        ))}
                    </ul>
                    <button onClick={() => navigate('/qr')}>Scan QR to Check In</button>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default Dashboard;
