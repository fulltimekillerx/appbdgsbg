
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { data, error: signupError } = await signup(email, password);
    if (signupError) {
      setError(signupError.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('User already exists. Please try a different email.');
    } else {
        setMessage('Signup successful! Please check your email to confirm your account.');
        setEmail('');
        setPassword('');
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'inline-block', width: '80px' }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'inline-block', width: '80px' }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
