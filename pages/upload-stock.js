
import React, { useState } from 'react';
import { supabase } from '../supabase/client'; // Import the Supabase client
import Papa from 'papaparse';

// Helper function to safely parse numbers
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Updated helper function to safely parse dates in dd/mm/yyyy and dd.mm.yyyy format
const parseDate = (value) => {
  if (!value) return null;
  // Attempt to parse dd/mm/yyyy or dd.mm.yyyy
  const parts = value.split(/[\/.]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`);
      if (!isNaN(date.getTime())) {
        return date.toISOString(); // Return ISO string for Supabase
      }
    }
  }
  // Fallback for other date formats
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
};


export default function UploadStock() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setErrorDetails([]); // Clear previous errors
  };

  const handleUpload = () => {
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setMessage('Processing file for synchronization...');
    setErrorDetails([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('CSV Headers:', results.meta.fields);
        let successCount = 0;
        let deleteCount = 0;
        const currentErrorDetails = [];

        // 1. Get all roll IDs from the CSV file
        const csvRollIds = new Set(results.data.map(row => row.roll_id ? String(row.roll_id).trim() : null).filter(id => id));

        // 2. Find and delete rolls not in the CSV
        setMessage('Removing old records...');
        const { data: dbRolls, error: fetchError } = await supabase.from('paper_rolls').select('roll_id');
        if (fetchError) {
          setMessage(`Error fetching existing rolls: ${fetchError.message}`);
          setUploading(false);
          return;
        }

        const rollsToDelete = dbRolls.filter(roll => !csvRollIds.has(roll.roll_id)).map(roll => roll.roll_id);
        if (rollsToDelete.length > 0) {
          const { error: deleteError } = await supabase.from('paper_rolls').delete().in('roll_id', rollsToDelete);
          if (deleteError) {
            currentErrorDetails.push(`Failed to delete old records: ${deleteError.message}`);
          } else {
            deleteCount = rollsToDelete.length;
          }
        }

        // 3. Process updates and additions
        setMessage('Updating and adding new records...');
        const upsertData = results.data.map((row, index) => {
            const csvRowNumber = index + 2;
            const rollId = row.roll_id ? String(row.roll_id).trim() : null;

            if (!rollId) {
                currentErrorDetails.push(`Row ${csvRowNumber}: Missing or empty roll_id.`);
                return null; // Skip this row
            }
            
            const weight = parseNumber(row.weight);
            if (weight === null) {
                currentErrorDetails.push(`Row ${csvRowNumber} (Roll ${rollId}): Missing or invalid weight.`);
                return null; // Skip this row
            }
            
            return {
                roll_id: rollId,
                weight: weight,
                gsm: parseNumber(row.gsm),
                width: parseNumber(row.width),
                length: parseNumber(row.length),
                diameter: parseNumber(row.diameter),
                bin_location: row.bin_location ? String(row.bin_location).trim() : null,
                goods_receive_date: parseDate(row.goods_receive_date),
                kind: row.kind ? String(row.kind).trim() : null,
                batch: row.batch ? String(row.batch).trim() : null,
                updated_at: new Date().toISOString(),
            };
        }).filter(Boolean); // Filter out null entries from validation errors

        if (upsertData.length > 0) {
            const { error: upsertError } = await supabase.from('paper_rolls').upsert(upsertData, { onConflict: 'roll_id' });

            if (upsertError) {
                currentErrorDetails.push(`Error synchronizing data: ${upsertError.message}`);
            } else {
                successCount = upsertData.length;
            }
        }

        const errorCount = currentErrorDetails.length;
        let finalMessage = `Synchronization complete. ${successCount} rows processed, ${deleteCount} rolls deleted.`;
        if (errorCount > 0) {
            finalMessage += ` ${errorCount} rows failed.`;
        }
        setMessage(finalMessage);
        setErrorDetails(currentErrorDetails);

        setFile(null);
        setUploading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setMessage('Error parsing CSV file. Please check the file format and content.');
        setUploading(false);
      },
    });
  };

  return (
    <div>
      <h1>Upload Stock</h1>
      <p>Upload a CSV file to synchronize stock. This will add new rolls, update existing ones, and delete any rolls not present in the file.</p>
      <input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Processing...' : 'Upload and Synchronize'}
      </button>
      {message && <p>{message}</p>}
      {errorDetails.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Error Details:</h3>
          <ul style={{ color: 'red', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {errorDetails.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
