import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import Link from 'next/link';

const FGTransporterList = () => {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransporters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fg_transporter').select('*');
    if (error) {
      setError(error.message);
    } else {
      setTransporters(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>FG Transporter Management</h2>
        <Link href="/logistic/fg-transporter-create" className="btn btn-primary">
          Add New Transporter
        </Link>
      </div>

      <h3>Current Transporters</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="alert alert-danger mt-3">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Truck No</th>
                <th>Truck Type</th>
                <th>Driver Name</th>
                <th>Driver Number</th>
                <th>Expedition</th>
                <th>Dimension (LxWxH)</th>
              </tr>
            </thead>
            <tbody>
              {transporters.map((t) => (
                <tr key={t.truck_no}>
                  <td>{t.truck_no}</td>
                  <td>{t.truck_type}</td>
                  <td>{t.driver_name}</td>
                  <td>{t.driver_number}</td>
                  <td>{t.expedition}</td>
                  <td>{`${t.dimension_length || 'N/A'} x ${t.dimension_width || 'N/A'} x ${t.dimension_height || 'N/A'}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FGTransporterList;
