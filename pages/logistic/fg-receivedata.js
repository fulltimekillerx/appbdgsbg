import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase/client';

const FGReceiveData = ({ plant }) => {
  const [fgReceiveData, setFgReceiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchFGReceiveData = async () => {
      setLoading(true);
      setError(null);

      if (!plant) {
        setFgReceiveData([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('fg_receive')
        .select('*')
        .eq('plant', plant);

      if (fetchError) {
        setError(fetchError.message || 'Failed to fetch FG Receive data');
      } else {
        setFgReceiveData(data);
      }
      setLoading(false);
    };

    fetchFGReceiveData();
  }, [plant]);

  const sortedData = useMemo(() => {
    if (fgReceiveData) {
      const sorted = [...fgReceiveData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
    return [];
  }, [fgReceiveData, sortColumn, sortDirection]);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>FG Receive Data</h2>
      <style jsx>{`
        table, th, td {
          border: 1px solid black;
          border-collapse: collapse;
          padding: 8px;
        }
        table {
          width: 100%;
        }
        th {
          cursor: pointer;
          user-select: none;
        }
        th:hover {
          background-color: #f2f2f2;
        }
      `}</style>
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('lmg_number')}>
              LMG Number{getSortIndicator('lmg_number')}
            </th>
            <th onClick={() => handleSort('bin_location')}>
              Bin Location{getSortIndicator('bin_location')}
            </th>
            <th onClick={() => handleSort('user_name')}>
              User{getSortIndicator('user_name')}
            </th>
            <th onClick={() => handleSort('created_at')}>
              Timestamp{getSortIndicator('created_at')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.id}>
              <td>{item.lmg_number}</td>
              <td>{item.bin_location}</td>
              <td>{item.user_name}</td>
              <td>{new Date(item.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FGReceiveData;
