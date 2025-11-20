import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useState, Children, cloneElement } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [plant, setPlant] = useState('7025');
  const [openMenu, setOpenMenu] = useState(null);

  const handlePlantChange = (event) => {
    setPlant(event.target.value);
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const childrenWithProps = Children.map(children, child => {
    return cloneElement(child, { plant });
  });

  const menuItems = {
    "Paper Roll": [
      { href: "/paper-roll/dashboard", label: "Dashboard" },
      { href: "/paper-roll/inventory", label: "Inventory" },
      { href: "/paper-roll/opname-report", label: "Opname Report" },
      { href: "/paper-roll/stock-opname", label: "Stock Opname" },
      { href: "/paper-roll/upload-stock", label: "Upload Stock" },
    ],
    "Logistic": [
        { href: "/logistic/fg-receive", label: "FG Receive" },
        { href: "/logistic/fg-receivedata", label: "FG Receive Data" },
    ],
    "Account": [
      { href: "/account/edit-account", label: "Edit Account" },
    ],
  };

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
                {Object.keys(menuItems).map(menu => (
                  <li key={menu}>
                    <a onClick={() => toggleMenu(menu)} style={{ cursor: 'pointer' }}>
                      {menu}
                    </a>
                    {openMenu === menu && (
                      <ul>
                        {menuItems[menu].map(item => (
                          <li key={item.href} style={{ marginLeft: '1rem' }}>
                            <Link href={item.href} legacyBehavior><a>{item.label}</a></Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                <li>
                  <button onClick={logout}>Log Out</button>
                </li>
                <li>
                <select value={plant} onChange={handlePlantChange}>
                  <option value="7025">7025</option>
                  <option value="7027">7027</option>
                </select>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/signup" legacyBehavior><a>Sign Up</a></Link>
                </li>
                <li>
                  <Link href="/login" legacyBehavior><a>Login</a></Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>
      <main className="main">
        <div className="header">
          <h1>WMS</h1>
          {user && <span>Welcome, {user.user_metadata.name}</span>}
        </div>
        <div className="content">
          {childrenWithProps}
        </div>
      </main>
    </div>
  );
};

export default Layout;
