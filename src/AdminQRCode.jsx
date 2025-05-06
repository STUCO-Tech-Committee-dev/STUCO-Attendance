// src/AdminQRCode.jsx
import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './AdminInterface.css';

const AdminQRCode = () => {
  const [text, setText] = useState('');
  const [value, setValue] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    setValue(text.trim());
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">QR Code Generator</h2>

      <form className="input-group" onSubmit={handleGenerate}>
        <input
          type="text"
          placeholder="Enter text or URL"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button className="admin-btn" type="submit">Generate</button>
      </form>

      {value && (
        <div className="qr-container">
          <QRCodeCanvas
            value={value}
            size={256}
            level="H"
            includeMargin
          />
          <p className="qr-value">{value}</p>
        </div>
      )}
    </div>
  );
};

export default AdminQRCode;
