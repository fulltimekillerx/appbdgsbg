
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { formatDate } from '../utils/dateFormatter';

export default function Inventory() {
  const [rolls, setRolls] = useState([]);
  const [kindAndGsmSearch, setKindAndGsmSearch] = useState('');
  const [widthSearch, setWidthSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'goods_receive_date', direction: 'ascending' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRolls = async () => {
      setLoading(true);
      try {
        const { data: rollsList, error } = await supabase
          .from('paper_rolls')
          .select('*');

        if (error) {
          console.error('Error fetching rolls:', error);
          setRolls([]);
        } else {
          setRolls(rollsList);
        }
      } catch (error) {
        console.error('Error fetching rolls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRolls();
  }, []);

  const sortedAndFilteredRolls = useMemo(() => {
    let filtered = rolls.map(roll => {
        const today = new Date();
        const receiveDate = roll.goods_receive_date ? new Date(roll.goods_receive_date) : null;
        const aging = receiveDate ? Math.floor((today - receiveDate) / (1000 * 60 * 60 * 24)) : null;
        return { ...roll, aging };
    }).filter(roll => {
      const kind = roll.kind || '';
      const gsm = roll.gsm ? roll.gsm.toString() : '';
      const width = roll.width ? roll.width.toString() : '';
      const batch = roll.batch || '';
      
      const searchTerm = kindAndGsmSearch.toLowerCase();
      const searchKind = searchTerm.replace(/[^a-z]/gi, '');
      const searchGsm = searchTerm.replace(/[^0-9]/g, '');

      const kindMatch = kind.toLowerCase().includes(searchKind);
      const gsmMatch = gsm.toLowerCase().includes(searchGsm);

      return (
        kindMatch &&
        gsmMatch &&
        width.toLowerCase().includes(widthSearch.toLowerCase()) &&
        batch.toLowerCase().includes(batchSearch.toLowerCase())
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'goods_receive_date') {
            const dateA = aValue ? new Date(aValue) : new Date(0);
            const dateB = bValue ? new Date(bValue) : new Date(0);
            if (dateA < dateB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (dateA > dateB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        }

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [rolls, kindAndGsmSearch, widthSearch, batchSearch, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  if (loading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div>
      <h1>Inventory</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by Kind or GSM"
          value={kindAndGsmSearch}
          onChange={e => {setKindAndGsmSearch(e.target.value);}}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search by Width"
          value={widthSearch}
          onChange={e => {setWidthSearch(e.target.value);}}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Search by Batch"
          value={batchSearch}
          onChange={e => {setBatchSearch(e.target.value);}}
          style={{ padding: '5px' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th onClick={() => requestSort('roll_id')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Roll ID</th>
            <th onClick={() => requestSort('batch')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Batch</th>
            <th onClick={() => requestSort('kind')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Kind</th>
            <th onClick={() => requestSort('gsm')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>GSM</th>
            <th onClick={() => requestSort('width')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Width</th>
            <th onClick={() => requestSort('length')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Length</th>
            <th onClick={() => requestSort('diameter')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Diameter</th>
            <th onClick={() => requestSort('bin_location')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Bin Location</th>
            <th onClick={() => requestSort('goods_receive_date')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Goods Receive Date</th>
            <th onClick={() => requestSort('aging')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Aging (days)</th>
            <th onClick={() => requestSort('weight')} style={{ border: '1px solid black', padding: '8px', cursor: 'pointer' }}>Weight</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredRolls.length > 0 ? (
            sortedAndFilteredRolls.map(roll => (
              <tr key={roll.id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.roll_id}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.batch}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.kind}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.gsm}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.width}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.length}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.diameter}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.bin_location}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.goods_receive_date ? formatDate(new Date(roll.goods_receive_date)) : 'N/A'}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.aging}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.weight}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" style={{ textAlign: 'center', padding: '20px' }}>
                No inventory found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
