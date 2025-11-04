import React from 'react';

export default function UploadStock() {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    // Handle file upload to Firebase Storage and trigger Cloud Function
  };

  return (
    <div>
      <h1>Upload Stock</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
    </div>
  );
}
