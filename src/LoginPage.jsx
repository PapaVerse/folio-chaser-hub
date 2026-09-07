import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Sun, Moon } from 'lucide-react';

export default function LoginPage({ onLogin, loading, errorMessage, isDarkMode, toggleTheme }) {
  const [loginEid, setLoginEid] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginEid, loginPassword);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      width: '100%', 
      background: isDarkMode 
        ? 'radial-gradient(circle at 50% -20%, #090d16 0%, #0f172a 60%, #020617 100%)' 
        : 'radial-gradient(circle at 50% -20%, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)', 
      fontFamily: 'Inter, system-ui, sans-serif', 
      boxSizing: 'border-box', 
      padding: '40px 20px',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      
      {/* Theme Toggle Button */}
      {toggleTheme && (
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
      )}

      {/* Background Decorative Glow Effects */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: isDarkMode ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '300px', height: '300px', background: isDarkMode ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.03)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }}></div>

      <form onSubmit={handleSubmit} style={{ 
        background: isDarkMode ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '40px 44px', 
        borderRadius: '24px', 
        width: '100%',
        maxWidth: '440px', 
        border: isDarkMode ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)', 
        boxShadow: isDarkMode ? '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(51, 65, 85, 0.5) inset' : '0 20px 40px -15px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(255, 255, 255, 0.5) inset', 
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.3s ease'
      }}>
        
        {/* Hub Title, Logo, Badge & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          
          {/* FCH Logo Display */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <img 
              src="/FCH-logo.jpg" 
              alt="Folio Chaser Hub Logo" 
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                objectFit: 'cover',
                boxShadow: isDarkMode ? '0 8px 18px rgba(37, 99, 235, 0.3)' : '0 8px 18px rgba(37, 99, 235, 0.15)',
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
            marginBottom: '12px',
            border: isDarkMode ? '1px solid rgba(96, 165, 250, 0.25)' : '1px solid rgba(37, 99, 235, 0.15)'
          }}>
            <Sparkles size={12} /> Enterprise Portal
          </div>
          
          <h1 style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', margin: '0 0 6px 0', fontSize: '25px', fontWeight: '800', letterSpacing: '-0.03em' }}>
            Folio Chaser Hub
          </h1>
          <p style={{ color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, fontSize: '13px', fontWeight: '500' }}>
            One Hub. Every Tool. One Team.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            background: isDarkMode ? 'rgba(127, 29, 29, 0.25)' : '#fef2f2',
            border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.4)' : '#fecaca'}`,
            color: isDarkMode ? '#fca5a5' : '#dc2626',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '18px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontWeight: '500' }}>{errorMessage}</span>
          </div>
        )}

        {/* Employee ID Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: isDarkMode ? '#cbd5e1' : '#334155', display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Employee ID (EID)
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} color={isDarkMode ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g., CXI11781"
              value={loginEid}
              onChange={(e) => setLoginEid(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '11px 14px 11px 40px', 
                borderRadius: '12px', 
                border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`, 
                background: isDarkMode ? '#0f172a' : '#ffffff', 
                color: isDarkMode ? '#f8fafc' : '#0f172a', 
                boxSizing: 'border-box', 
                fontSize: '14px', 
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? '#334155' : '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: isDarkMode ? '#cbd5e1' : '#334155', display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color={isDarkMode ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '11px 40px 11px 40px', 
                borderRadius: '12px', 
                border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`, 
                background: isDarkMode ? '#0f172a' : '#ffffff', 
                color: isDarkMode ? '#f8fafc' : '#0f172a', 
                boxSizing: 'border-box', 
                fontSize: '14px', 
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? '#334155' : '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: isDarkMode ? '#64748b' : '#94a3b8', padding: 0, display: 'flex' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '22px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#475569', cursor: 'pointer', userSelect: 'none', fontWeight: '500' }}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`, cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <span>Remember this device</span>
          </label>
        </div>

        {/* Sign In Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '12px', 
            fontWeight: '600', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', 
            opacity: loading ? 0.7 : 1, 
            fontSize: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.transform = 'translateY(0)';
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        </button>

        {/* Footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(241, 245, 249, 0.8)'}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: isDarkMode ? '#4ade80' : '#16a34a', fontSize: '12px', fontWeight: '600' }}>
            <ShieldCheck size={15} />
            <span>Secure 256-bit SSL Connection</span>
          </div>
          <span style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: '11px', fontWeight: '500' }}>Authorized Personnel Only • v1.0.0</span>
        </div>

      </form>
    </div>
  );
}