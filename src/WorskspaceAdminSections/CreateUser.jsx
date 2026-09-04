import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CreateUser() {
  const [eid, setEid] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
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
            role: role 
          }
        ]);

      if (error) throw error;

      setSuccessMessage(`User account for ${employeeName} (${eid}) successfully created and synchronized!`);
      setEid('');
      setEmployeeName('');
      setPassword('');
      setRole('employee');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px' }}>
      <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <UserPlus size={20} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Create New User Account</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Add workspace & tool access credentials (synced across hub apps)</p>
          </div>
        </div>

        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Employee ID (EID)</label>
            <input 
              type="text" 
              value={eid} 
              onChange={(e) => setEid(e.target.value)} 
              placeholder="e.g., CXI12345" 
              required 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Employee Full Name</label>
            <input 
              type="text" 
              value={employeeName} 
              onChange={(e) => setEmployeeName(e.target.value)} 
              placeholder="e.g., JUAN DELA CRUZ" 
              required 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password</label>
            <input 
              type="text" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Set secure password" 
              required 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Access Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', outline: 'none' }}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Create Account</span>
          </button>
        </form>
      </div>
    </div>
  );
}