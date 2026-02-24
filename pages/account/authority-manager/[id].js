import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { useRouter } from 'next/router';
import Select from 'react-select';

// Define custom styles for react-select to stack selected items
const customSelectStyles = {
  multiValue: (provided) => ({
    ...provided,
    width: '98%', // Force the tag to take up most of the width, causing a new line
    justifyContent: 'space-between',
    marginBottom: '5px',
  }),
};

export default function EditAuthority() {
  const router = useRouter();
  const { id: userId } = router.query; // Get the user ID from the URL

  const [user, setUser] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (!userId) return; // Don't run if the user ID isn't available yet

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch the specific user's profile
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('id, email, permissions')
          .eq('id', userId)
          .single(); // We expect only one user

        if (userError) throw userError;
        setUser(userData);

        // Fetch all possible authorities
        const { data: authoritiesData, error: authoritiesError } = await supabase
          .from('authorities')
          .select('name, description');

        if (authoritiesError) throw authoritiesError;
        const authorityOptions = authoritiesData.map(auth => ({
          value: auth.name,
          label: `${auth.name}${auth.description ? ` - ${auth.description}` : ''}`
        }));
        setAuthorities(authorityOptions);

        // Set the initial state of the multi-select dropdown
        if (userData?.permissions) {
            const initialSelection = authorityOptions.filter(opt => 
                userData.permissions.includes(opt.value)
            );
            setSelectedPermissions(initialSelection);
        }

      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setNotification('');

    const newPermissionValues = selectedPermissions.map(opt => opt.value);

    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({ permissions: newPermissionValues, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(); // IMPORTANT: Return the updated data
    
    if (updateError) {
      setNotification(`Error: ${updateError.message}`);
    } else if (!data || data.length === 0) {
      // This is the crucial check for RLS issues
      setNotification('Error: Update failed. This is likely a permission issue. Please check that your Row Level Security policies allow admins to update the user_profiles table.');
    } else {
      // On successful save, navigate back to the user list
      router.push('/account/authority-manager');
    }
  };

  if (loading) return <div>Loading user data...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!user) return <div>User not found.</div>;

  return (
    <div>
      <h1>Edit Permissions for {user.email}</h1>
      <p>Select the pages and capabilities this user should have access to.</p>

      {notification && <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{notification}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Permissions:</label>
        <Select
          isMulti
          options={authorities}
          value={selectedPermissions}
          onChange={setSelectedPermissions}
          placeholder="Select permissions..."
          closeMenuOnSelect={false}
          styles={customSelectStyles}
        />
      </div>

      <div>
        <button 
            onClick={handleSave} 
            style={{ marginRight: '1rem', padding: '10px 15px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          Save
        </button>
        <button 
            onClick={() => router.push('/account/authority-manager')} 
            style={{ padding: '10px 15px', background: '#ccc', color: 'black', border: 'none', borderRadius: '5px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
