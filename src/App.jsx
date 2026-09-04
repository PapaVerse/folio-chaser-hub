import { useState } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './LoginPage';
import WorkspaceDashboard from './WorkspaceDashboard';
import WorkspaceDashboardEmployee from './WorkspaceDashboardEmployee';
import { LayoutGrid, Hotel, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('hub'); // 'hub', 'login', 'admin-dashboard', 'employee-dashboard'
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      setLoading(false);

      // Route depending on role column value ('admin' vs 'employee')
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
    setCurrentView('hub');
  };

  // Render Admin Dashboard
  if (currentView === 'admin-dashboard' && currentUser) {
    return (
      <WorkspaceDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
    );
  }

  // Render Employee Dashboard
  if (currentView === 'employee-dashboard' && currentUser) {
    return (
      <WorkspaceDashboardEmployee 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
    );
  }

  // Render Login Page View
  if (currentView === 'login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ padding: '20px 40px' }}>
          <button 
            onClick={() => { setCurrentView('hub'); setErrorMessage(''); }}
            style={{ padding: '8px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            ← Back to Hub Landing Page
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '40px' }}>
          <LoginPage onLogin={handleLogin} loading={loading} errorMessage={errorMessage} />
        </div>
      </div>
    );
  }

  // Main Hub Landing Page (`http://localhost:5174/`)
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', padding: '60px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '900px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.025em' }}>FOLIO CHASER HUB</h1>
          <p style={{ color: '#2563eb', margin: '0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>One Hub. Every Tool. One Team.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          
          {/* FC Workspace Card */}
          <div 
            onClick={() => setCurrentView('login')}
            style={{ background: '#ffffff', padding: '36px', borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '20px' }}>
              <LayoutGrid size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>FC Workspace</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Efficiency, Performance, and Streamlined Operations.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '14px', fontWeight: '700' }}>
              <span>Launch Workspace</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Hotel Mapping Card */}
          <a 
            href="https://hotel-directory-hotel-mapping.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', background: '#ffffff', padding: '36px', borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'block' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: '20px' }}>
              <Hotel size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Hotel Mapping</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Manage transport directories, partner hotel mappings, folios, and records efficiently.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '14px', fontWeight: '700' }}>
              <span>Launch Tool</span>
              <ArrowRight size={16} />
            </div>
          </a>

        </div>

      </div>
    </div>
  );
}