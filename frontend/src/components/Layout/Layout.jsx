import { Link, Outlet, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/macro', label: 'Macro' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/risk', label: 'Risk' },
    { path: '/capm', label: 'CAPM' },
    { path: '/valuation', label: 'Valuation' },
    { path: '/chat', label: '🤖 GalaAI' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <nav className="nav">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">🐶</span>
            <span className="nav-logo-text">Gala Analytics</span>
          </Link>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Gala Analytics - Quantitative Analysis for Financial Markets</p>
      </footer>
    </div>
  );
};

export default Layout;
