import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Trash2, Loader2, Shield, User } from 'lucide-react';

export default function ManageUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user profile?')) return;

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Failed to delete user.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Users size={20} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Manage Users</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>View and maintain all active workspace & tool user accounts</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                <th style={{ padding: '14px 20px' }}>Employee Name</th>
                <th style={{ padding: '14px 20px' }}>EID</th>
                <th style={{ padding: '14px 20px' }}>Role</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a' }}>
                    {u.employee_name || 'N/A'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                    {u.eid}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      background: u.role === 'admin' ? '#eff6ff' : '#f1f5f9',
                      color: u.role === 'admin' ? '#2563eb' : '#475569'
                    }}>
                      {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      <span style={{ textTransform: 'uppercase' }}>{u.role}</span>
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(u.id)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}