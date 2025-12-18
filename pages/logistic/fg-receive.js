import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase/client';

const FGReceive = ({ plant }) => {
  const { user } = useAuth();
  const [lmgNumber, setLmgNumber] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // Clear message after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!plant) {
      setError('No plant selected. Please select a plant before submitting.');
      setSubmitting(false);
      return;
    }

    const { error: submitError } = await supabase
      .from('fg_receive')
      .insert([
        {
          lmg_number: lmgNumber,
          bin_location: binLocation,
          user_id: user?.user_metadata?.display_name || user?.email,
          plant: plant,
        },
      ]);

    if (submitError) {
      setError(submitError.message || 'Failed to submit FG Receive data');
    } else {
      setMessage('FG Receive data submitted successfully');
      setLmgNumber('');
      setBinLocation('');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2>FG Receive</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .form-group {
          display: grid;
          grid-template-columns: 120px 1fr;
          align-items: center;
          gap: 1rem;
        }
        label {
          text-align: right;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          box-sizing: border-box;
        }
        button {
          grid-column: 1 / -1; /* Span across all columns */
          justify-self: center;
          padding: 0.5rem 1rem;
        }
        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="binLocation">Bin Location</label>
          <input
            type="text"
            id="binLocation"
            value={binLocation}
            onChange={(e) => setBinLocation(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lmgNumber">LMG Number</label>
          <input
            type="text"
            id="lmgNumber"
            value={lmgNumber}
            onChange={(e) => setLmgNumber(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default FGReceive;
