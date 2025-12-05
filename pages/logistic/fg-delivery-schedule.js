import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase/client';
import { formatDate } from '../../utils/dateFormatter';

const DeliveryScheduleData = ({ plant }) => {
  const [deliveryScheduleData, setDeliveryScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState('rdd');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchDeliveryScheduleData = async () => {
    if (!plant || !selectedDate) {
      alert('Please select a plant and a date.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('fg_delivery_schedule')
      .select('*')
      .eq('plant', plant)
      .eq('schedule_date', selectedDate);

    if (fetchError) {
      setError(fetchError.message || 'Failed to fetch delivery schedule data');
    } else {
      setDeliveryScheduleData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setDeliveryScheduleData([]);
  }, [plant]);

  const sortedData = useMemo(() => {
    if (deliveryScheduleData) {
      const sorted = [...deliveryScheduleData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
    return [];
  }, [deliveryScheduleData, sortColumn, sortDirection]);

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
      <h2>Delivery Schedule Data</h2>
      <div>
        <label htmlFor="scheduleDate">Select Schedule Date: </label>
        <input
          type="date"
          id="scheduleDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={fetchDeliveryScheduleData} disabled={!selectedDate || !plant}>
          Load Data
        </button>
      </div>
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
        div {
          margin-bottom: 1rem;
        }
      `}</style>
      {deliveryScheduleData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('sales_no')}>Sales No{getSortIndicator('sales_no')}</th>
              <th onClick={() => handleSort('sales_item')}>Sales Item{getSortIndicator('sales_item')}</th>
              <th onClick={() => handleSort('customer_name')}>Customer Name{getSortIndicator('customer_name')}</th>
              <th onClick={() => handleSort('print_design')}>Print Design{getSortIndicator('print_design')}</th>
              <th onClick={() => handleSort('rdd')}>RDD{getSortIndicator('rdd')}</th>
              <th onClick={() => handleSort('gross_weight')}>Gross Weight{getSortIndicator('gross_weight')}</th>
              <th onClick={() => handleSort('order_qty')}>Order Qty{getSortIndicator('order_qty')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.id}>
                <td>{item.sales_no}</td>
                <td>{item.sales_item}</td>
                <td>{item.customer_name}</td>
                <td>{item.print_design}</td>
                <td>{formatDate(item.rdd)}</td>
                <td>{item.gross_weight}</td>
                <td>{item.order_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeliveryScheduleData;
