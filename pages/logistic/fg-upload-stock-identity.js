
import React, { useState } from 'react';
import { supabase } from '../../supabase/client'; // Import the Supabase client
import Papa from 'papaparse';

// Helper function to safely parse numbers
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

export default function FgUploadStockIdentity({ plant }) {
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

    if (!plant) {
        setMessage('No plant selected. Please select a plant before uploading.');
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
        const currentErrorDetails = [];

        const lmgNumbersFromCsv = results.data.map(row => String(row.lmg_number ?? '').trim()).filter(id => id);

        if (lmgNumbersFromCsv.length === 0) {
            setMessage('No lmg_number found in the CSV file.');
            setUploading(false);
            return;
        }

        // Fetch existing lmg_numbers from fg_stock for the current plant to ensure we only update existing records
        const { data: existingStock, error: fetchError } = await supabase
            .from('fg_stock')
            .select('lmg_number')
            .eq('plant', plant)
            .in('lmg_number', lmgNumbersFromCsv);

        if (fetchError) {
            setMessage(`Error fetching existing stock for plant ${plant}: ${fetchError.message}`);
            setUploading(false);
            return;
        }
        
        const existingLmgNumbers = new Set(existingStock.map(item => item.lmg_number));

        // Filter data to only update records that exist in the database
        const dataToUpdate = results.data.map((row, index) => {
            const csvRowNumber = index + 2;
            const lmg_number = String(row.lmg_number ?? '').trim();

            if (!lmg_number) {
                currentErrorDetails.push(`Row ${csvRowNumber}: Missing or empty lmg_number.`);
                return null; // Skip this row
            }

            if (!existingLmgNumbers.has(lmg_number)) {
                currentErrorDetails.push(`Row ${csvRowNumber} (LMG ${lmg_number}): Does not exist for plant ${plant} and will be skipped.`);
                return null;
            }
            
            // Construct the update payload, including the plant and explicitly omitting bin_location.
            const updatePayload = {
                lmg_number: lmg_number,
                plant: plant, // Always include the selected plant
                so_number: row.so_number ? String(row.so_number).trim() : null,
                so_item: row.so_item ? String(row.so_item).trim() : null,
                customer_name: row.customer_name ? String(row.customer_name).trim() : null,
                print_design: row.print_design ? String(row.print_design).trim() : null,
                quantity: parseNumber(row.quantity),
                weight: parseNumber(row.weight),
            };

            return updatePayload;
        }).filter(Boolean); // Filter out null entries from validation errors

        if (dataToUpdate.length > 0) {
            // Upsert the data. `onConflict` on `lmg_number` will find the existing row to update.
            const { error: updateError } = await supabase.from('fg_stock').upsert(dataToUpdate, { onConflict: 'lmg_number' });

            if (updateError) {
                // The error message will now be more informative if something else goes wrong.
                currentErrorDetails.push(`Error updating data for plant ${plant}: ${updateError.message}`);
            } else {
                successCount = dataToUpdate.length;
            }
        }

        const errorCount = currentErrorDetails.length;
        let finalMessage = `Synchronization complete for plant ${plant}. ${successCount} rows updated.`;
        if (errorCount > 0) {
            finalMessage += ` ${errorCount} rows had errors or were skipped.`;
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
      <h1>FG Upload Stock Identity</h1>
      <p>Upload a CSV file to update stock identity (SO Number, Customer, etc.) for the selected plant. This will only update existing items and will not add new ones.</p>
      <input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Processing...' : 'Upload and Synchronize'}
      </button>
      {message && <p>{message}</p>}
      {errorDetails.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Error/Skipped Details:</h3>
          <ul style={{ color: 'orange', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {errorDetails.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
