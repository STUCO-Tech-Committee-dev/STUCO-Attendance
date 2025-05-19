import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added import
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import "./AdminInterface.css";

const ProxyRequest = () => {
  const navigate = useNavigate(); // Initialize navigate
  const location = useLocation(); // Access location state
  const sessionId = location.state?.sessionId; // Get session ID from QR scan
  const [date, setDate] = useState("");
  const [proxyName, setProxyName] = useState(""); // Updated field
  const [electedMembers, setElectedMembers] = useState([]);
  const [proxyingFor, setProxyingFor] = useState(""); // Dropdown selection
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!sessionId) {
      alert("Session ID is missing. Please scan the QR code again.");
      navigate("/qr", { state: { isProxyRequest: true } }); // Redirect back to QR scanning
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    const fetchElectedMembers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const members = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setElectedMembers(members);
    };

    fetchElectedMembers();
  }, []);

  useEffect(() => {
    if (!expectedCode || !videoRef.current) return;

    QrScanner.WORKER_PATH = 'https://unpkg.com/qr-scanner/qr-scanner-worker.min.js';

    const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data.trim() === expectedCode.trim()) {
            setQrVerified(true);
            setError('');
            scanner.stop();
          } else {
            setQrVerified(false);
            setError('Scanned QR is invalid for the current session.');
          }
        },
        {
          highlightScanRegion: true,
          returnDetailedScanResult: true,
        }
    );

    scannerRef.current = scanner;
    scanner.start().catch((err) => {
      console.error('QR Scanner start error:', err);
      setError('Failed to access camera.');
    });

    return () => {
      scanner.stop();
    };
  }, [expectedCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      alert("Session ID is missing. Please scan the QR code again.");
      navigate("/");
      return;
    }

    try {
      await addDoc(collection(db, "proxyRequests"), {
        date,
        proxyName, // Ensure proxyName is included
        proxyingFor, // Ensure proxyingFor is included
        description,
        sessionId, // Ensure sessionId is included
        createdAt: serverTimestamp(),
      });
      alert("Proxy request submitted successfully!");
      navigate("/dashboard"); // Redirect after submission
    } catch (error) {
      console.error("Error submitting proxy request:", error);
      alert("Failed to submit proxy request.");
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Proxy Submission Form</h2>
      <button
        className="admin-btn"
        onClick={() => navigate("/")} // Ensure route matches App.js
        style={{ marginBottom: "1rem" }}
      >
        ← Back to Auth Page
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
          <label>Your Name:</label>
          <input
            type="text"
            value={proxyName}
            onChange={(e) => setProxyName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Who You Are Proxying For:</label>
          <select
            value={proxyingFor}
            onChange={(e) => setProxyingFor(e.target.value)}
            required
          >
            <option value="">Select an elected member</option>
            {electedMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.id})
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Reason for Proxy:</label>
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
