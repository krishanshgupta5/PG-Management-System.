import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <nav style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Left section (empty to balance flex) */}
      <div style={{ flex: 1 }}></div>
      
      {/* Center section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <h1 className="gradient-text" style={{ fontSize: '31.2px', fontWeight: 'bold', margin: 0 }}>Gram PG</h1>
      </div>
      
      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px', flex: 1 }}>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        {user && (
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={24} />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
