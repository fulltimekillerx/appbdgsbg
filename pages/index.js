import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Paper Roll Warehouse Management</h1>
    </div>
  );
}
