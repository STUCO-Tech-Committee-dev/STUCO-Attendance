import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import './AdminInterface.css';

const ProxyManagement = () => {
    const [proxyRequests, setProxyRequests] = useState([]);
    const [approvedProxies, setApprovedProxies] = useState([]);
    const [view, setView] = useState('pending'); // 'pending' or 'approved'

    useEffect(() => {
        const loadProxyRequests = async () => {
            const snap = await getDocs(collection(db, 'proxyRequests'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort by date descending
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setProxyRequests(data);
        };

        const loadApprovedProxies = async () => {
            const snap = await getDocs(collection(db, 'approvedRequests'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Sort by date descending
            data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setApprovedProxies(data);
        };

        loadProxyRequests();
        loadApprovedProxies();
    }, []);

    const handleAccept = async (request) => {
        try {
            const requestRef = doc(db, 'proxyRequests', request.id);
            const approvedRef = collection(db, 'approvedRequests');

            await addDoc(approvedRef, { ...request, approvedAt: serverTimestamp() });
            await deleteDoc(requestRef);

            setProxyRequests(prev => prev.filter(r => r.id !== request.id));
            setApprovedProxies(prev => [
                { ...request, approved: true },
                ...approvedProxies
            ]);
            alert('Proxy request accepted.');
        } catch (error) {
            console.error('Error accepting proxy request:', error);
            alert('Failed to accept proxy request.');
        }
    };

    const handleReject = async (request) => {
        try {
            await deleteDoc(doc(db, 'proxyRequests', request.id));
            alert('Proxy request rejected.');
            setProxyRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (error) {
            console.error('Error rejecting proxy request:', error);
            alert('Failed to reject proxy request.');
        }
    };

    return (
        <div className="admin-container">
            <h2 className="admin-title">Proxy Management</h2>

            {/* Dropdown Toggle */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <select
                    className="admin-input styled-input"
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                >
                    <option value="pending">Pending Requests</option>
                    <option value="approved">Approved Requests</option>
                </select>
            </div>

            {/* Pending Proxies */}
            {view === 'pending' && (
                <div className="proxy-requests-container">
                    <h3>Pending Proxy Requests</h3>
                    {proxyRequests.length === 0 ? (
                        <p>No pending proxy requests.</p>
                    ) : (
                        proxyRequests.map((request) => (
                            <div key={request.id} className="proxy-request-bubble">
                                <p><strong>Date:</strong> {new Date(request.date).toLocaleDateString()}</p>
                                <p><strong>Name:</strong> {request.name}</p>
                                <p><strong>Username:</strong> {request.username}</p>
                                <p><strong>Chosen Proxy:</strong> {request.proxy}</p>
                                <p><strong>Reason:</strong> {request.description}</p>
                                <div className="proxy-actions">
                                    <button className="accept-btn" onClick={() => handleAccept(request)}>Accept</button>
                                    <button className="reject-btn" onClick={() => handleReject(request)}>Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Approved Proxies */}
            {view === 'approved' && (
                <div className="approved-proxies-container">
                    <h3>Approved Proxy Requests</h3>
                    {approvedProxies.length === 0 ? (
                        <p>No approved proxy requests.</p>
                    ) : (
                        approvedProxies.map((proxy) => (
                            <div key={proxy.id} className="proxy-request-bubble">
                                <p><strong>Date:</strong> {new Date(proxy.date).toLocaleDateString()}</p>
                                <p><strong>Name:</strong> {proxy.name}</p>
                                <p><strong>Username:</strong> {proxy.username}</p>
                                <p><strong>Chosen Proxy:</strong> {proxy.proxy}</p>
                                <p><strong>Reason:</strong> {proxy.description}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ProxyManagement;
