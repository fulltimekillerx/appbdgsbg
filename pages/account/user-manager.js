
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const UserManger = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const pages = [
    '/',
    '/forgot-password',
    '/login',
    '/signup',
    '/account/edit-account',
    '/logistic/fg-delivery-schedule',
    '/logistic/fg-receive',
    '/logistic/fg-receivedata',
    '/logistic/fg-upload-delivery-schedule',
    '/paper-roll/pr-dashboard',
    '/paper-roll/pr-opname-report',
    '/paper-roll/pr-stock',
    '/paper-roll/pr-upload-stock',
    '/paper-roll/roll/[id]',
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from('users')
      .update(editingUser)
      .eq('id', editingUser.id);

    if (error) {
      console.error('Error updating user:', error);
    } else {
      setUsers(users.map((user) => (user.id === editingUser.id ? editingUser : user)));
      setEditingUser(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1>User Manager</h1>
      <input
        type="text"
        placeholder="Search by email"
        value={searchTerm}
        onChange={handleSearch}
      />
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Display Name</th>
            <th>Plant</th>
            <th>Permission</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.display_name}</td>
              <td>
                {editingUser && editingUser.id === user.id ? (
                  <input
                    type="text"
                    value={editingUser.plant.join(', ')}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        plant: e.target.value.split(',').map((p) => p.trim()),
                      })
                    }
                  />
                ) : (
                  user.plant.join(', ')
                )}
              </td>
              <td>
                {editingUser && editingUser.id === user.id ? (
                  <select
                    multiple
                    value={editingUser.permission}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        permission: Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        ),
                      })
                    }
                  >
                    {pages.map((page) => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                ) : (
                  user.permission.join(', ')
                )}
              </td>
              <td>
                {editingUser && editingUser.id === user.id ? (
                  <button onClick={handleSave}>Save</button>
                ) : (
                  <button onClick={() => handleEdit(user)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManger;
