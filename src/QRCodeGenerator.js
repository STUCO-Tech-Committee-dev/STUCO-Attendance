import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import './QRScanner.css';

const QRScanner = () => {
    const scannerRef = useRef(null);
    const [status, setStatus] = useState('Initializing...');
    const [scannedCode, setScannedCode] = useState(null);
    const [isScanning, setIsScanning] = useState(false);  // Track scanning state
    const meetingCode = 'stuco-meeting-5-11'; // The QR code value to match

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");

        // Detect available cameras and start scanning from the first one
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length) {
                const cameraId = devices[0].id;

                html5QrCode.start(
                    cameraId,
                    {
                        fps: 10, // frames per second
                        qrbox: { width: 250, height: 250 }, // QR scanning box size
                    },
                    async (decodedText, decodedResult) => {
                        setScannedCode(decodedText);
                        setStatus(`Scanned: ${decodedText}`);

                        // Stop the scanner once a code is detected
                        if (isScanning) {
                            await html5QrCode.stop();  // Stop scanning only if it's actively scanning
                            setIsScanning(false);
                        }

                        // Check if the QR code matches the meeting code
                        if (decodedText === meetingCode) {
                            const user = auth.currentUser;
                            if (user) {
                                const username = user.email.split('@')[0];

                                // Mark attendance in Firestore
                                await updateDoc(doc(db, 'users', username), {
                                    attendance: arrayUnion({
                                        meeting: meetingCode,
                                        timestamp: new Date().toISOString(),
                                    }),
                                });

                                setStatus("✅ Attendance marked successfully.");
                            } else {
                                setStatus("❌ User not logged in.");
                            }
                        } else {
                            setStatus("❌ Invalid QR code.");
                        }
                    },
                    (error) => {
                        console.error("QR Code error", error);
                        setStatus("❌ Error scanning the code.");
                    }
                ).then(() => {
                    setIsScanning(true);  // Mark that the scanner is active
                }).catch((err) => {
                    console.error("Failed to start QR scanner", err);
                    setStatus("❌ Failed to access camera.");
                });
            }
        });

        // Cleanup the scanner when the component unmounts
        return () => {
            if (isScanning) {
                html5QrCode.stop().catch(() => {}); // Make sure to stop scanning on cleanup
            }
        };
    }, [isScanning]);

    return (
        <div className="scanner-container">
            <h2>Scan Meeting QR Code</h2>
            <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
            <p>{status}</p>
            {scannedCode && <p>Scanned Code: {scannedCode}</p>}
        </div>
    );
};

export default QRScanner;
