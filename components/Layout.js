import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="sidebar-header">
          Navigation
        </div>
        <nav>
          <ul>
            {user ? (
              <>
                <li>
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link href="/upload-stock">Upload Stock</Link>
                </li>
                <li>
                  <Link href="/inventory">Inventory</Link>
                </li>
                <li>
                  <Link href="/stock-opname">Stock Opname</Link>
                </li>
                <li>
                  <Link href="/opname-report">Opname Report</Link>
                </li>
                <li>
                  <button onClick={logout}>Log Out</button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/signup">Sign Up</Link>
                </li>
                <li>
                  <Link href="/login">Login</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>
      <main className="main">
        <div className="header">
          <h1>Paper Roll WMS</h1>
          {user && <span>Welcome, {user.email}</span>}
        </div>
        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
