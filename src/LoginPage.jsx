import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin, loading, errorMessage }) {
  const [loginEid, setLoginEid] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginEid, loginPassword);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box', padding: '20px', overflow: 'hidden' }}>
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '32px 40px', borderRadius: '16px', width: '380px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}>
        
        {/* Hub Title & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#0f172a', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.025em' }}>FOLIO CHASER HUB</h1>
          <p style={{ color: '#2563eb', margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>One Hub. Every Tool. One Team.</p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Sign in to access centralized tools</p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Employee ID Input */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ color: '#334155', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Employee ID (EID)</label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g., CXI11781"
              value={loginEid}
              onChange={(e) => setLoginEid(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ color: '#334155', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 38px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '15px', height: '15px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <span>Remember this device</span>
          </label>
        </div>

        {/* Sign In Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', opacity: loading ? 0.7 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{loading ? 'Signing In...' : 'Sign In'}</span>
        </button>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#64748b', fontSize: '11px', fontWeight: '500' }}>
            <ShieldCheck size={13} color="#16a34a" />
            <span>Secure 256-bit SSL Connection</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Authorized Personnel Only • v1.0.0</span>
        </div>

      </form>
    </div>
  );
}