import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/lessons', label: 'Lessons' },
  { path: '/playground', label: 'Python' },
  { path: '/database', label: 'Database' },
  { path: '/data-flow', label: 'Data Flow' },
  { path: '/rag-demo', label: 'RAG Demo' },
  { path: '/resources', label: 'Resources' },
];

export default function Navbar() {
  const location = useLocation();
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('clay-theme') || 'light'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('clay-theme', next);
  };

  return (
    <nav className="clay-nav">
      <div className="clay-nav__inner">
        <Link to="/" className="clay-nav__logo">
          🎓 RAG <span>Academy</span>
        </Link>
        <ul className="clay-nav__links">
          {NAV_ITEMS.map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={location.pathname === path ? 'active' : ''}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          className="clay-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
