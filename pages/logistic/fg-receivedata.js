import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase/client';

const FGReceiveData = ({ plant }) => {
  const [receiveData, setReceiveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchReceiveData = async () => {
    if (!plant) {
      // alert('Please select a plant.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('fg_receive')
      .select(`
        id,
        created_at,
        lmg_number,
        bin_location,
        plant,
        user:user_id(raw_user_meta_data)
      `)
      .eq('plant', plant);

    if (fetchError) {
      setError(fetchError.message || 'Failed to fetch FG Receive data');
    } else {
      setReceiveData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReceiveData();
  }, [plant]);

  const sortedData = useMemo(() => {
    if (receiveData) {
      const sorted = [...receiveData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
    return [];
  }, [receiveData, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div>
      <h2>FG Receive Data</h2>
      <button onClick={fetchReceiveData} disabled={!plant}>
        Refresh Data
      </button>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <style jsx>{`
        table, th, td {
          border: 1px solid black;
          border-collapse: collapse;
          padding: 8px;
        }
        table {
          width: 100%;
          margin-top: 1rem;
        }
        th {
          cursor: pointer;
          user-select: none;
        }
        th:hover {
          background-color: #f2f2f2;
        }
      `}</style>
      {receiveData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('lmg_number')}>LMG Number{getSortIndicator('lmg_number')}</th>
              <th onClick={() => handleSort('bin_location')}>Bin Location{getSortIndicator('bin_location')}</th>
              <th onClick={() => handleSort('created_at')}>Received At{getSortIndicator('created_at')}</th>
              <th onClick={() => handleSort('user')}>User{getSortIndicator('user')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.id}>
                <td>{item.lmg_number}</td>
                <td>{item.bin_location}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>{item.user.raw_user_meta_data.display_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FGReceiveData;
