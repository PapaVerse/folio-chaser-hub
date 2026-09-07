import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './LoginPage';
import WorkspaceDashboard from './WorkspaceDashboard';
import WorkspaceDashboardEmployee from './WorkspaceDashboardEmployee';
import { LayoutGrid, Hotel, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react';

export default function App() {
  // Initialize state from localStorage to preserve session on page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('fch_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('fch_current_user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      return userObj.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard';
    }
    return 'hub'; // 'hub', 'login', 'admin-dashboard', 'employee-dashboard'
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Dark mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('fch_theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fch_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // 30-Minute Inactivity Auto-Logout Effect
  useEffect(() => {
    if (!currentUser) return;

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // 30 minutes in milliseconds (30 * 60 * 1000 = 1,800,000 ms)
      inactivityTimer = setTimeout(() => {
        handleLogout();
        alert('You have been automatically logged out due to 30 minutes of inactivity.');
      }, 30 * 60 * 1000);
    };

    // Events that signal user activity
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer on load
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  const handleLogin = async (loginEid, loginPassword) => {
    setErrorMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('eid', loginEid.trim())
        .eq('password', loginPassword.trim())
        .single();

      if (error || !data) {
        setErrorMessage('Invalid Employee ID (EID) or Password. Please check your credentials and try again.');
        setLoading(false);
        return;
      }

      setCurrentUser(data);
      localStorage.setItem('fch_current_user', JSON.stringify(data));
      setLoading(false);

      if (data.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('employee-dashboard');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fch_current_user');
    setCurrentView('hub');
  };

  // Render Admin Dashboard
  if (currentView === 'admin-dashboard' && currentUser) {
    return (
      <WorkspaceDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Render Employee Dashboard
  if (currentView === 'employee-dashboard' && currentUser) {
    return (
      <WorkspaceDashboardEmployee 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Render Login Page View
  if (currentView === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#0f172a', transition: 'all 0.3s ease', position: 'relative' }}>
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
            border: '1px solid',
            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            zIndex: 20
          }}
        >
          {isDarkMode ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#475569" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <LoginPage onLogin={handleLogin} loading={loading} errorMessage={errorMessage} isDarkMode={isDarkMode} />
      </div>
    );
  }

  // Main Hub Landing Page (`http://localhost:5174/`)
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: isDarkMode 
        ? 'radial-gradient(circle at 50% -20%, #090d16 0%, #0f172a 60%, #020617 100%)' 
        : 'radial-gradient(circle at 50% -20%, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)', 
      color: isDarkMode ? '#f8fafc' : '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif', 
      padding: '60px 20px', 
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
          border: '1px solid',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13px',
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
          zIndex: 20,
          transition: 'all 0.2s ease'
        }}
      >
        {isDarkMode ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#475569" />}
        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Background Decorative Glow Effects */}
      <div style={{ position: 'absolute', top: '5%', left: '10%', width: '350px', height: '350px', background: isDarkMode ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: '350px', height: '350px', background: isDarkMode ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.03)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }}></div>

      <div style={{ maxWidth: '900px', width: '100%', position: 'relative', zIndex: 10 }}>
        
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          
          {/* Modern Logo Container */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <img 
              src="/FCH-logo.jpg" 
              alt="Folio Chaser Hub Logo" 
              style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '18px', 
                objectFit: 'cover',
                boxShadow: isDarkMode ? '0 10px 25px -5px rgba(37, 99, 235, 0.4), 0 0 0 2px rgba(30, 41, 59, 0.8)' : '0 10px 25px -5px rgba(37, 99, 235, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.8)',
                border: isDarkMode ? '2px solid #1e293b' : '2px solid #ffffff'
              }} 
            />
          </div>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 12px', 
            background: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.12) 100%)', 
            borderRadius: '20px', 
            color: isDarkMode ? '#60a5fa' : '#2563eb', 
            fontSize: '11px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            marginBottom: '14px',
            border: isDarkMode ? '1px solid rgba(96, 165, 250, 0.25)' : '1px solid rgba(37, 99, 235, 0.15)'
          }}>
            <Sparkles size={12} /> Enterprise Ecosystem
          </div>

          <h1 style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', margin: '0 0 8px 0', fontSize: '34px', fontWeight: '800', letterSpacing: '-0.03em' }}>
            FOLIO CHASER HUB
          </h1>
          <p style={{ color: isDarkMode ? '#94a3b8' : '#64748b', margin: '0', fontSize: '14px', fontWeight: '600', letterSpacing: '0.01em' }}>
            One Hub. Every Tool. One Team.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          
          {/* FC Workspace Card */}
          <div 
            onClick={() => setCurrentView('login')}
            style={{ 
              background: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '36px', 
              borderRadius: '20px', 
              border: isDarkMode ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)', 
              cursor: 'pointer', 
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', 
              boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 20px 35px -10px rgba(37, 99, 235, 0.25)' : '0 20px 35px -10px rgba(37, 99, 235, 0.12)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)';
            }}
          >
            <div style={{ width: '52px', height: '52px', background: isDarkMode ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#4ade80' : '#16a34a', marginBottom: '20px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)' }}>
              <LayoutGrid size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.02em' }}>FC Workspace</h3>
            <p style={{ margin: '0 0 24px 0', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Efficiency, Performance, and Streamlined Operations.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDarkMode ? '#4ade80' : '#16a34a', fontSize: '14px', fontWeight: '700' }}>
              <span>Launch Workspace</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Hotel Mapping Card */}
          <a 
            href="https://hotel-directory-hotel-mapping.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              textDecoration: 'none', 
              background: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.85)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '36px', 
              borderRadius: '20px', 
              border: isDarkMode ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)', 
              cursor: 'pointer', 
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', 
              boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)', 
              display: 'block' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 20px 35px -10px rgba(37, 99, 235, 0.25)' : '0 20px 35px -10px rgba(37, 99, 235, 0.12)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)';
            }}
          >
            <div style={{ width: '52px', height: '52px', background: isDarkMode ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.3) 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#60a5fa' : '#2563eb', marginBottom: '20px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)' }}>
              <Hotel size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: isDarkMode ? '#f8fafc' : '#0f172a', letterSpacing: '-0.02em' }}>Hotel Mapping</h3>
            <p style={{ margin: '0 0 24px 0', color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Manage transport directories, partner hotel mappings, folios, and records efficiently.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDarkMode ? '#60a5fa' : '#2563eb', fontSize: '14px', fontWeight: '700' }}>
              <span>Launch Tool</span>
              <ArrowRight size={16} />
            </div>
          </a>

        </div>

      </div>
    </div>
  );
}