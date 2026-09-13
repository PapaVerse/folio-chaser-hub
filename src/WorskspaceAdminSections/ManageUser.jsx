// ManageUser.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Trash2, Edit3, Loader2, Shield, User, X, CheckCircle2, AlertCircle, Filter, AlertTriangle, MoreVertical } from 'lucide-react';

export default function ManageUser({ isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedCluster, setSelectedCluster] = useState('ALL');
  
  // Actions Menu Popover State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

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
  const [editIsActive, setEditIsActive] = useState(true);
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

    // Close actions menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setEditIsActive(user.is_active ?? true);
    setSuccessMessage('');
    setErrorMessage('');
    setActiveMenuId(null);
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
          cluster: editCluster.trim(),
          is_active: editIsActive
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

  const departments = ['ALL', ...new Set(users.map(u => u.department).filter(Boolean))];
  const clusters = ['ALL', ...new Set(users.map(u => u.cluster).filter(Boolean))];

  const filteredUsers = users.filter(u => {
    const matchesDept = selectedDepartment === 'ALL' || u.department === selectedDepartment;
    const matchesCluster = selectedCluster === 'ALL' || u.cluster === selectedCluster;
    return matchesDept && matchesCluster;
  });

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
    inactiveRowBg: isDarkMode ? 'rgba(51, 65, 85, 0.35)' : '#f1f5f9',
    inactiveText: isDarkMode ? '#64748b' : '#94a3b8',
    adminBadgeBg: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.08)',
    adminBadgeBorder: isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.15)',
    adminBadgeText: isDarkMode ? '#93c5fd' : '#2563eb',
    employeeBadgeBg: isDarkMode ? '#334155' : 'rgba(241, 245, 249, 1)',
    employeeBadgeBorder: isDarkMode ? '#475569' : '#e2e8f0',
    employeeBadgeText: isDarkMode ? '#cbd5e1' : '#64748b',
    menuDropdownBg: isDarkMode ? '#0f172a' : '#ffffff',
    menuHover: isDarkMode ? '#334155' : '#f8fafc',
    resetBtnBg: isDarkMode ? '#334155' : '#e2e8f0',
    resetBtnText: isDarkMode ? '#f8fafc' : '#334155',
    modalOverlay: isDarkMode ? 'rgba(2, 6, 23, 0.75)' : 'rgba(15, 23, 42, 0.5)',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: isDarkMode ? 'none' : '0 4px 12px -2px rgba(15, 23, 42, 0.03)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: theme.iconBg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.iconColor }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.textMain, letterSpacing: '-0.01em' }}>
                Manage Users <span style={{ fontSize: '13px', fontWeight: '500', color: theme.textMuted }}>({filteredUsers.length}/{users.length})</span>
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>View and maintain all workspace user accounts</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ background: theme.filterBarBg, padding: '10px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.textSub, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Filter size={14} color={theme.iconColor} />
            <span>Filter:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>Dept:</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'ALL' ? 'All Departments' : dept}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>Cluster:</label>
            <select 
              value={selectedCluster} 
              onChange={(e) => setSelectedCluster(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '12px', outline: 'none', cursor: 'pointer' }}
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
              style={{ padding: '6px 10px', background: theme.resetBtnBg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: theme.resetBtnText }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Scrollable Table Container */}
        <div style={{ maxHeight: '560px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: theme.tableHeaderBg }}>
              <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSub, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 14px', width: '45px', textAlign: 'center' }}>No.</th>
                <th style={{ padding: '10px 16px' }}>Employee Name</th>
                <th style={{ padding: '10px 16px' }}>EID</th>
                <th style={{ padding: '10px 16px' }}>Department</th>
                <th style={{ padding: '10px 16px' }}>Cluster</th>
                <th style={{ padding: '10px 16px' }}>Role</th>
                <th style={{ padding: '10px 16px' }}>Created At</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const isInactive = u.is_active === false;
                  return (
                    <tr 
                      key={u.id} 
                      style={{ 
                        borderBottom: `1px solid ${theme.tableBorder}`, 
                        background: isInactive ? theme.inactiveRowBg : 'transparent',
                        opacity: isInactive ? 0.75 : 1,
                        transition: 'background 0.15s ease' 
                      }} 
                      onMouseEnter={(e) => { if (!isInactive) e.currentTarget.style.background = theme.rowHover; }} 
                      onMouseLeave={(e) => { if (!isInactive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: isInactive ? theme.inactiveText : theme.textMuted, fontSize: '12px' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: isInactive ? theme.inactiveText : theme.textMain }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{u.employee_name || 'N/A'}</span>
                          {isInactive && (
                            <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: isDarkMode ? '#334155' : '#e2e8f0', color: theme.inactiveText, textTransform: 'uppercase' }}>
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', color: isInactive ? theme.inactiveText : theme.textMuted, fontFamily: 'monospace', fontWeight: '600', fontSize: '12px' }}>
                        {u.eid}
                      </td>
                      <td style={{ padding: '10px 16px', color: isInactive ? theme.inactiveText : theme.textSub, fontWeight: '500' }}>
                        {u.department || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: isInactive ? theme.inactiveText : theme.textSub, fontWeight: '500' }}>
                        {u.cluster || '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '10px', 
                          fontWeight: '700',
                          background: isInactive ? (isDarkMode ? '#1e293b' : '#e2e8f0') : (u.role === 'admin' ? theme.adminBadgeBg : theme.employeeBadgeBg),
                          color: isInactive ? theme.inactiveText : (u.role === 'admin' ? theme.adminBadgeText : theme.employeeBadgeText),
                          border: `1px solid ${isInactive ? theme.border : (u.role === 'admin' ? theme.adminBadgeBorder : theme.employeeBadgeBorder)}`
                        }}>
                          {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                          <span style={{ textTransform: 'uppercase' }}>{u.role}</span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: isInactive ? theme.inactiveText : theme.textMuted, fontSize: '12px', fontWeight: '500' }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', position: 'relative' }}>
                        {/* 3-Dots Action Button */}
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          style={{
                            background: activeMenuId === u.id ? theme.filterBarBg : 'transparent',
                            border: `1px solid ${activeMenuId === u.id ? theme.border : 'transparent'}`,
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: isInactive ? theme.inactiveText : theme.textMuted,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === u.id && (
                          <div 
                            ref={menuRef}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '42px',
                              width: '130px',
                              background: theme.menuDropdownBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '8px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                              zIndex: 10,
                              overflow: 'hidden',
                              textAlign: 'left'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: theme.textMain,
                                cursor: 'pointer',
                                borderBottom: `1px solid ${theme.tableBorder}`
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = theme.menuHover}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Edit3 size={13} color={theme.iconColor} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUserToDelete(u);
                                setActiveMenuId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#dc2626',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={13} color="#dc2626" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Confirmation Delete Modal */}
      {userToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: theme.modalOverlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: theme.modalBg, borderRadius: '14px', width: '100%', maxWidth: '380px', border: `1px solid ${theme.border}`, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', background: isDarkMode ? 'rgba(127, 29, 29, 0.4)' : '#fef2f2', border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', margin: '0 auto 14px auto' }}>
              <AlertTriangle size={22} />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>Delete User Profile?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: theme.textMuted, lineHeight: '1.4' }}>
              Are you sure you want to delete <strong style={{ color: theme.textMain }}>{userToDelete.employee_name || userToDelete.eid}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                style={{ flex: 1, padding: '9px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#475569', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '9px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: theme.modalOverlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: theme.modalBg, borderRadius: '14px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.border}`, boxSizing: 'border-box' }}>
            
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: theme.iconBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.iconColor }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>Edit User Profile</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>Modify credentials & status for {editingUser.employee_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                style={{ background: isDarkMode ? '#334155' : '#f1f5f9', border: 'none', cursor: 'pointer', color: theme.textMuted, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {successMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDarkMode ? '#064e3b' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, color: isDarkMode ? '#86efac' : '#16a34a', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' }}>
                  <CheckCircle2 size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDarkMode ? '#7f1d1d' : '#fef2f2', border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`, color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Status Toggle Selector */}
              <div style={{ background: theme.filterBarBg, padding: '12px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain }}>Account Status</span>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>{editIsActive ? 'Active (Visible & enabled)' : 'Inactive (Grayed out indicator)'}</span>
                </div>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textMain, fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee ID (EID)</label>
                <input 
                  type="text" 
                  value={editEid} 
                  onChange={(e) => setEditEid(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Employee Full Name</label>
                <input 
                  type="text" 
                  value={editEmployeeName} 
                  onChange={(e) => setEditEmployeeName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                <input 
                  type="text" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Department</label>
                  <input 
                    type="text" 
                    value={editDepartment} 
                    onChange={(e) => setEditDepartment(e.target.value)} 
                    placeholder="e.g., Operations" 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cluster</label>
                  <input 
                    type="text" 
                    value={editCluster} 
                    onChange={(e) => setEditCluster(e.target.value)} 
                    placeholder="e.g., Cluster A" 
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', outline: 'none', background: theme.inputBg, color: theme.textMain }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Access Role</label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', boxSizing: 'border-box', background: theme.inputBg, color: theme.textMain, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ flex: 1, padding: '10px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', fontWeight: '600', color: isDarkMode ? '#f8fafc' : '#475569', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
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