import React from 'react';
// import useBarcodeScanner from '../hooks/useBarcodeScanner';

export default function Scan() {
  // const { startScanner, stopScanner, scannedCode } = useBarcodeScanner();

  return (
    <div>
      <h1>Scan QR/Barcode</h1>
      {/* <button onClick={startScanner}>Start Scanner</button>
      <button onClick={stopScanner}>Stop Scanner</button>
      {scannedCode && <p>Scanned Code: {scannedCode}</p>} */}
      <div id="scanner-container"></div>
    </div>
  );
}
