import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Trash2, Edit3, Loader2, Shield, User, X, CheckCircle2, AlertCircle, Filter, AlertTriangle } from 'lucide-react';

export default function ManageUser({ isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedCluster, setSelectedCluster] = useState('ALL');
  
  // Delete Modal States
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [editEid, setEditEid] = useState('');
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('employee');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCluster, setEditCluster] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userToDelete.id);

    if (!error) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } else {
      alert('Failed to delete user.');
    }
    setDeleting(false);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditEid(user.eid || '');
    setEditEmployeeName(user.employee_name || '');
    setEditPassword(user.password || '');
    setEditRole(user.role || 'employee');
    setEditDepartment(user.department || '');
    setEditCluster(user.cluster || '');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          eid: editEid.trim(),
          employee_name: editEmployeeName.trim(),
          password: editPassword.trim(),
          role: editRole,
          department: editDepartment.trim(),
          cluster: editCluster.trim()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setSuccessMessage('User profile updated successfully!');
      fetchUsers();
      
      setTimeout(() => {
        setEditingUser(null);
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format timestamp cleanly
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Derive unique department and cluster options from the users list
  const departments = ['ALL', ...new Set(users.map(u => u.department).filter(Boolean))];
  const clusters = ['ALL', ...new Set(users.map(u => u.cluster).filter(Boolean))];

  // Filter users based on selected department and cluster
  const filteredUsers = users.filter(u => {
    const matchesDept = selectedDepartment === 'ALL' || u.department === selectedDepartment;
    const matchesCluster = selectedCluster === 'ALL' || u.cluster === selectedCluster;
    return matchesDept && matchesCluster;
  });

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    modalBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    tableBorder: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    textSub: isDarkMode ? '#cbd5e1' : '#475569',
    labelColor: isDarkMode ? '#cbd5e1' : '#334155',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    filterBarBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f8fafc',
    iconBg: isDarkMode ? '#1e3a8a' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    iconColor: isDarkMode ? '#93c5fd' : '#2563eb',
    rowHover: isDarkMode ? '#334155' : '#f8fafc',
    adminBadgeBg: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.08)',
    adminBadgeBorder: isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.15)',
    adminBadgeText: isDarkMode ? '#93c5fd' : '#2563eb',
    employeeBadgeBg: isDarkMode ? '#334155' : 'rgba(241, 245, 249, 1)',
    employeeBadgeBorder: isDarkMode ? '#475569' : '#e2e8f0',
    employeeBadgeText: isDarkMode ? '#cbd5e1' : '#64748b',
    editBtnBg: isDarkMode ? '#1e3a8a' : '#eff6ff',
    editBtnBorder: isDarkMode ? '#1d4ed8' : '#bfdbfe',
    editBtnText: isDarkMode ? '#93c5fd' : '#2563eb',
    deleteBtnBg: isDarkMode ? '#7f1d1d' : '#fef2f2',
    deleteBtnBorder: isDarkMode ? '#991b1b' : '#fecaca',
    deleteBtnText: isDarkMode ? '#fca5a5' : '#dc2626',
    resetBtnBg: isDarkMode ? '#334155' : '#e2e8f0',
    resetBtnText: isDarkMode ? '#f8fafc' : '#334155',
    modalOverlay: isDarkMode ? 'rgba(2, 6, 23, 0.75)' : 'rgba(15, 23, 42, 0.5)',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', width: '100%' }}>
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: theme.cardBg, borderRadius: '20px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: isDarkMode ? 'none' : '0 10px 25px -5px rgba(15, 23, 42, 0.05)' }}>
        
        {/* Header */}
        <div style={{ padding: '28px 36px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: theme.iconBg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.iconColor, boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.1)' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: theme.textMain, letterSpacing: '-0.02em' }}>
                Manage Users ({filteredUsers.length} of {users.length})
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>View and maintain all active workspace & tool user accounts</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ background: theme.filterBarBg, padding: '16px 36px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSub, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Filter size={16} color={theme.iconColor} />
            <span>Filter By:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>Department:</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'ALL' ? 'All Departments' : dept}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>Cluster:</label>
            <select 
              value={selectedCluster} 
              onChange={(e) => setSelectedCluster(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              {clusters.map((cluster) => (
                <option key={cluster} value={cluster}>{cluster === 'ALL' ? 'All Clusters' : cluster}</option>
              ))}
            </select>
          </div>

          {(selectedDepartment !== 'ALL' || selectedCluster !== 'ALL') && (
            <button 
              type="button"
              onClick={() => { setSelectedDepartment('ALL'); setSelectedCluster('ALL'); }}
              style={{ padding: '8px 14px', background: theme.resetBtnBg, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: theme.resetBtnText }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Scrollable Table Container */}
        <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: theme.tableHeaderBg }}>
              <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSub, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '16px 20px', width: '60px', textAlign: 'center' }}>No.</th>
                <th style={{ padding: '16px 24px' }}>Employee Name</th>
                <th style={{ padding: '16px 24px' }}>EID</th>
                <th style={{ padding: '16px 24px' }}>Department</th>
                <th style={{ padding: '16px 24px' }}>Cluster</th>
                <th style={{ padding: '16px 24px' }}>Role</th>
                <th style={{ padding: '16px 24px' }}>Created At</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${theme.tableBorder}`, transition: 'background 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = theme.rowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600', color: theme.textMuted, fontSize: '13px' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '18px 24px', fontWeight: '600', color: theme.textMain }}>
                      {u.employee_name || 'N/A'}
                    </td>
                    <td style={{ padding: '18px 24px', color: theme.textMuted, fontFamily: 'monospace', fontWeight: '600' }}>
                      {u.eid}
                    </td>
                    <td style={{ padding: '18px 24px', color: theme.textSub, fontWeight: '500' }}>
                      {u.department || '—'}
                    </td>
                    <td style={{ padding: '18px 24px', color: theme.textSub, fontWeight: '500' }}>
                      {u.cluster || '—'}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '5px 12px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        background: u.role === 'admin' ? theme.adminBadgeBg : theme.employeeBadgeBg,
                        color: u.role === 'admin' ? theme.adminBadgeText : theme.employeeBadgeText,
                        border: u.role === 'admin' ? `1px solid ${theme.adminBadgeBorder}` : `1px solid ${theme.employeeBadgeBorder}`
                      }}>
                        {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        <span style={{ textTransform: 'uppercase' }}>{u.role}</span>
                      </span>
                    </td>
                    <td style={{ padding: '18px 24px', color: theme.textMuted, fontSize: '13px', fontWeight: '500' }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEdit(u)}
                          style={{ background: theme.editBtnBg, border: `1px solid ${theme.editBtnBorder}`, color: theme.editBtnText, padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease' }}
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => setUserToDelete(u)}
                          style={{ background: theme.deleteBtnBg, border: `1px solid ${theme.deleteBtnBorder}`, color: theme.deleteBtnText, padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease' }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Confirmation Delete Modal */}
      {userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme.modalOverlay,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: theme.modalBg,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: isDarkMode ? '0 20px 40px -15px rgba(0, 0, 0, 0.6)' : '0 20px 40px -15px rgba(15, 23, 42, 0.25)',
            border: `1px solid ${theme.border}`,
            boxSizing: 'border-box',
            padding: '32px 28px',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: isDarkMode ? 'rgba(127, 29, 29, 0.4)' : '#fef2f2', 
              border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`,
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#dc2626', 
              margin: '0 auto 20px auto' 
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
              Delete User Profile?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: theme.textMain }}>{userToDelete.employee_name || userToDelete.eid}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#475569', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme.modalOverlay,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: theme.modalBg,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: isDarkMode ? '0 20px 40px -15px rgba(0, 0, 0, 0.5)' : '0 20px 40px -15px rgba(15, 23, 42, 0.2)',
            border: `1px solid ${theme.border}`,
            boxSizing: 'border-box'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: theme.iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.iconColor }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>Edit User Profile</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted }}>Modify credentials for {editingUser.employee_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', cursor: 'pointer', color: theme.textMuted, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#475569' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateUser} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {successMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDarkMode ? '#064e3b' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, color: isDarkMode ? '#86efac' : '#16a34a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDarkMode ? '#7f1d1d' : '#fef2f2', border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`, color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Employee ID (EID)
                </label>
                <input 
                  type="text" 
                  value={editEid} 
                  onChange={(e) => setEditEid(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Employee Full Name
                </label>
                <input 
                  type="text" 
                  value={editEmployeeName} 
                  onChange={(e) => setEditEmployeeName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Password
                </label>
                <input 
                  type="text" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Department
                  </label>
                  <input 
                    type="text" 
                    value={editDepartment} 
                    onChange={(e) => setEditDepartment(e.target.value)} 
                    placeholder="e.g., Operations" 
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Cluster
                  </label>
                  <input 
                    type="text" 
                    value={editCluster} 
                    onChange={(e) => setEditCluster(e.target.value)} 
                    placeholder="e.g., Cluster A" 
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.labelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Access Role
                </label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, fontSize: '14px', boxSizing: 'border-box', background: theme.inputBg, color: theme.textMain, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ flex: 1, padding: '12px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#475569', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}