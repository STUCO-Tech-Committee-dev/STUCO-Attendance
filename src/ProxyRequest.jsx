import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added import
import { db, auth } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import './AdminInterface.css';

const ProxyRequest = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [proxy, setProxy] = useState('');
  const [description, setDescription] = useState('');
  const [nonVotingMembers, setNonVotingMembers] = useState([]);

  useEffect(() => {
    const fetchNonVotingMembers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const members = snap.docs
        .map(doc => doc.id)
        .filter(id => id !== auth.currentUser.email.split('@')[0]); // Exclude current user
      setNonVotingMembers(members);
    };

    if (auth.currentUser) {
      setUsername(auth.currentUser.email.split('@')[0]);
      fetchNonVotingMembers();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'proxyRequests'), {
      date,
      name,
      username,
      proxy,
      description,
    });
    alert('Proxy request submitted successfully!');
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Proxy Request Form</h2>
      <button
        className="admin-btn"
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '1rem' }}
      >
        ← Back to Dashboard
      </button>
      <form className="proxy-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Date of Meeting:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Username:</label>
          <input type="text" value={username} readOnly />
        </div>
        <div className="input-group">
          <label>Chosen Proxy:</label>
          <select
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            required
          >
            <option value="">Select a proxy</option>
            {nonVotingMembers.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Description/Reason:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-btn">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default ProxyRequest;
