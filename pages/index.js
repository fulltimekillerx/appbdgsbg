import Link from 'next/link';
import Login from '../components/Login';

export default function Home() {
  return (
    <div>
      <h1>Paper Roll Warehouse Management</h1>
      <Login />
      <nav>
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/scan">Scan Roll</Link>
          </li>
          <li>
            <Link href="/upload-stock">Upload Stock</Link>
          </li>
          <li>
            <Link href="/history">Movement History</Link>
          </li>
          <li>
            <Link href="/sync">Sync</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
