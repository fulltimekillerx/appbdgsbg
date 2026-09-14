import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase/client';

const FGStockData = ({ plant }) => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // State for search inputs
  const [lmgNumberSearch, setLmgNumberSearch] = useState('');
  const [binLocationSearch, setBinLocationSearch] = useState('');
  const [customerNameSearch, setCustomerNameSearch] = useState('');
  const [printDesignSearch, setPrintDesignSearch] = useState('');
  const [soNumberSearch, setSoNumberSearch] = useState('');

  const fetchStockData = async () => {
    if (!plant) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('fg_stock')
      .select('*')
      .eq('plant', plant);

    if (fetchError) {
      setError(fetchError.message || 'Failed to fetch FG Stock data');
      setStockData([]);
    } else {
      setStockData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStockData();
  }, [plant]);

  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const lmgNumber = item.lmg_number || '';
      const binLocation = item.bin_location || '';
      const customerName = item.customer_name || '';
      const printDesign = item.print_design || '';
      const soNumber = item.so_number ? item.so_number.toString() : '';

      return (
        lmgNumber.toLowerCase().includes(lmgNumberSearch.toLowerCase()) &&
        binLocation.toLowerCase().includes(binLocationSearch.toLowerCase()) &&
        customerName.toLowerCase().includes(customerNameSearch.toLowerCase()) &&
        printDesign.toLowerCase().includes(printDesignSearch.toLowerCase()) &&
        soNumber.toLowerCase().includes(soNumberSearch.toLowerCase())
      );
    });
  }, [stockData, lmgNumberSearch, binLocationSearch, customerNameSearch, printDesignSearch, soNumberSearch]);


  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

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
      <h2>FG Stock Data</h2>
      <button onClick={fetchStockData} disabled={!plant || loading} style={{ marginBottom: '20px' }}>
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search LMG Number"
          value={lmgNumberSearch}
          onChange={e => setLmgNumberSearch(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search by Bin Location"
          value={binLocationSearch}
          onChange={e => setBinLocationSearch(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search Customer Name"
          value={customerNameSearch}
          onChange={e => setCustomerNameSearch(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search Print Design"
          value={printDesignSearch}
          onChange={e => setPrintDesignSearch(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search by SO"
          value={soNumberSearch}
          onChange={e => setSoNumberSearch(e.target.value)}
          style={{ padding: '5px' }}
        />
      </div>

      {error && <p className="alert alert-danger">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th onClick={() => handleSort('lmg_number')}>LMG Number{getSortIndicator('lmg_number')}</th>    
                <th onClick={() => handleSort('bin_location')}>Bin Location{getSortIndicator('bin_location')}</th>
                <th onClick={() => handleSort('so_number')}>SO Number{getSortIndicator('so_number')}</th>
                <th onClick={() => handleSort('so_item')}>SO Item{getSortIndicator('so_item')}</th>
                <th onClick={() => handleSort('customer_name')}>Customer Name{getSortIndicator('customer_name')}</th>
                <th onClick={() => handleSort('print_design')}>Print Design{getSortIndicator('print_design')}</th>
                <th onClick={() => handleSort('quantity')}>Quantity{getSortIndicator('quantity')}</th>
                <th onClick={() => handleSort('weight')}>Weight{getSortIndicator('weight')}</th>
                <th onClick={() => handleSort('updated_at')}>Updated At{getSortIndicator('updated_at')}</th>
                <th onClick={() => handleSort('user_id')}>User{getSortIndicator('user_id')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr key={item.lmg_number}>
                  <td>{item.lmg_number}</td>
                  <td>{item.bin_location}</td>
                  <td>{item.so_number}</td>
                  <td>{item.so_item}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.print_design}</td>
                  <td>{item.quantity}</td>
                  <td>{item.weight}</td>
                  <td>{new Date(item.updated_at).toLocaleString()}</td>
                  <td>{item.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FGStockData;
