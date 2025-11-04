import React, { useState } from 'react';

export default function UploadStock() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    // Implement the file upload logic here
    if (file) {
      console.log('Uploading', file.name);
    }
  };

  return (
    <div>
      <h1>Upload Stock</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
