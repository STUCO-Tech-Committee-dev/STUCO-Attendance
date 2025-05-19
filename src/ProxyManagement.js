import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { db } from "./firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import "./AdminInterface.css";

const ProxyManagement = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [proxyRequests, setProxyRequests] = useState([]);
  const [approvedProxies, setApprovedProxies] = useState([]);
  const [view, setView] = useState("pending"); // 'pending' or 'approved'

  const formatDateToEST = (createdAt) => {
    const parsedDate =
      typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate();
    return parsedDate.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });
  };

  const formatTimeToEST = (createdAt) => {
    const parsedDate =
      typeof createdAt === "string" ? new Date(createdAt) : createdAt.toDate();
    return parsedDate.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
    });
  };

  useEffect(() => {
    const loadProxyRequests = async () => {
      const snap = await getDocs(collection(db, "proxyRequests"));
      const data = snap.docs.map((d) => ({
        id: d.id,
        createdAt: d.data().createdAt,
        date: d.data().date,
        description: d.data().description,
        proxyName: d.data().proxyName,
        proxyingFor: d.data().proxyingFor,
        sessionId: d.data().sessionId,
      }));

      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setProxyRequests(data);
    };

    const loadApprovedProxies = async () => {
      const snap = await getDocs(collection(db, "approvedRequests"));
      const data = snap.docs.map((d) => ({
        id: d.id,
        createdAt: d.data().createdAt,
        date: d.data().date,
        description: d.data().description,
        proxyName: d.data().proxyName,
        proxyingFor: d.data().proxyingFor,
        sessionId: d.data().sessionId,
      }));

      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setApprovedProxies(data);
    };

    loadProxyRequests();
    loadApprovedProxies();
  }, []);

  const handleAccept = async (request) => {
    try {
      const userRef = doc(db, "users", request.proxyingFor); // Use proxyingFor field
      const userSnap = await getDocs(collection(db, "users"));
      const user = userSnap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .find((u) => u.id === request.proxyingFor);

      if (!user) {
        alert("Elected member not found.");
        return;
      }

      // Update attendance for the session
      const updatedAttendance = [
        ...user.attendance,
        `${request.sessionId} proxy`,
      ]; // Include session ID with "proxy"

      await updateDoc(userRef, {
        attendance: updatedAttendance,
        absences: user.absences, // Do not add an absence
      });

      // Move request to approvedRequests collection
      await addDoc(collection(db, "approvedRequests"), {
        ...request,
        approvedAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "proxyRequests", request.id));

      setProxyRequests((prev) => prev.filter((r) => r.id !== request.id));
      setApprovedProxies((prev) => [
        { ...request, approved: true },
        ...approvedProxies,
      ]);

      alert("Proxy request accepted and attendance updated.");
    } catch (error) {
      console.error("Error accepting proxy request:", error);
      alert("Failed to accept proxy request.");
    }
  };

  const handleReject = async (request) => {
    try {
      await deleteDoc(doc(db, "proxyRequests", request.id));
      alert("Proxy request rejected.");
      setProxyRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting proxy request:", error);
      alert("Failed to reject proxy request.");
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Proxy Management</h2>

      {/* Dropdown Toggle */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <select
          className="admin-input styled-input"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="pending">Pending Requests</option>
          <option value="approved">Approved Requests</option>
        </select>
      </div>

      <button
        className="admin-btn"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "1rem" }}
      >
        ← Back
      </button>

      {/* Pending Proxies */}
      {view === "pending" && (
        <div className="proxy-requests-container">
          <h3>Pending Proxy Requests</h3>
          {proxyRequests.length === 0 ? (
            <p>No pending proxy requests.</p>
          ) : (
            proxyRequests.map((request) => (
              <div key={request.id} className="proxy-request-bubble">
                <p>
                  <strong>Date:</strong> {formatDateToEST(request.createdAt)}
                </p>
                <p>
                  <strong>Time:</strong> {formatTimeToEST(request.createdAt)}
                </p>
                <p>
                  <strong>Proxy Name:</strong> {request.proxyName}
                </p>
                <p>
                  <strong>Proxying For:</strong> {request.proxyingFor}
                </p>
                <p>
                  <strong>Session ID:</strong> {request.sessionId}
                </p>
                <p>
                  <strong>Reason:</strong> {request.description}
                </p>
                <div className="proxy-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(request)}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(request)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approved Proxies */}
      {view === "approved" && (
        <div className="approved-proxies-container">
          <h3>Approved Proxy Requests</h3>
          {approvedProxies.length === 0 ? (
            <p>No approved proxy requests.</p>
          ) : (
            approvedProxies.map((proxy) => (
              <div key={proxy.id} className="proxy-request-bubble">
                <p>
                  <strong>Date:</strong> {formatDateToEST(proxy.createdAt)}
                </p>
                <p>
                  <strong>Time:</strong> {formatTimeToEST(proxy.createdAt)}
                </p>
                <p>
                  <strong>Proxy Name:</strong> {proxy.proxyName}
                </p>
                <p>
                  <strong>Proxying For:</strong> {proxy.proxyingFor}
                </p>
                <p>
                  <strong>Session ID:</strong> {proxy.sessionId}
                </p>
                <p>
                  <strong>Reason:</strong> {proxy.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProxyManagement;
