import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = () => {
    const canvasRef = useRef(null);
    const meetingCode = 'stuco-meeting-5-11';

    const downloadQRCode = () => {
        const canvas = canvasRef.current.querySelector('canvas');
        const pngUrl = canvas
            .toDataURL('image/png')
            .replace('image/png', 'image/octet-stream');

        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'meeting-qr-code.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>QR Code for Meeting</h2>
            <div ref={canvasRef}>
                <QRCodeCanvas value={meetingCode} size={256} />
            </div>
            <br />
            <button onClick={downloadQRCode}>Download QR Code</button>
        </div>
    );
};

export default QRCodeGenerator;
