import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CreateUser({ isDarkMode }) {
  const [eid, setEid] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('');
  const [cluster, setCluster] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('app_users')
        .insert([
          { 
            eid: eid.trim(), 
            employee_name: employeeName.trim(), 
            password: password.trim(), 
            role: role,
            department: department.trim(),
            cluster: cluster.trim()
          }
        ]);

      if (error) throw error;

      setSuccessMessage(`User account for ${employeeName} (${eid}) successfully created and synchronized!`);
      setEid('');
      setEmployeeName('');
      setPassword('');
      setRole('employee');
      setDepartment('');
      setCluster('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    labelColor: isDarkMode ? '#cbd5e1' : '#334155',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    headerBorder: isDarkMode ? '#334155' : '#f1f5f9',
    iconBg: isDarkMode ? '#1e3a8a' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    iconColor: isDarkMode ? '#93c5fd' : '#2563eb',
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ background: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? 'none' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: `1px solid ${theme.headerBorder}` }}>
          <div style={{ width: '48px', height: '48px', background: theme.iconBg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.iconColor, boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.1)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: theme.textMain, letterSpacing: '-0.02em' }}>Create New User Account</h2>
            <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>Add workspace & tool access credentials (synced across hub apps)</p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#064e3b' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, color: isDarkMode ? '#86efac' : '#16a34a', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#7f1d1d' : '#fef2f2', border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`, color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Employee ID (EID)
            </label>
            <input 
              type="text" 
              value={eid} 
              onChange={(e) => setEid(e.target.value)} 
              placeholder="e.g., CXI12345" 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain, transition: 'all 0.2s ease' }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Employee Full Name
            </label>
            <input 
              type="text" 
              value={employeeName} 
              onChange={(e) => setEmployeeName(e.target.value)} 
              placeholder="e.g., JUAN DELA CRUZ" 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain, transition: 'all 0.2s ease' }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <input 
              type="text" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Set secure password" 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain, transition: 'all 0.2s ease' }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Department
              </label>
              <input 
                type="text" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                placeholder="e.g., Operations" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain, transition: 'all 0.2s ease' }}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cluster
              </label>
              <input 
                type="text" 
                value={cluster} 
                onChange={(e) => setCluster(e.target.value)} 
                placeholder="e.g., Cluster A" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain, transition: 'all 0.2s ease' }}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Access Role
            </label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', background: theme.inputBg, color: theme.textMain, outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '12px', 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '14px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.transform = 'translateY(0)'; }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>

        </form>
      </div>
    </div>
  );
}