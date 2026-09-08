import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Layers, User, FolderGit2, AlertTriangle, X, Search, History, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminProfile({ currentUser, isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [selectedTier, setSelectedTier] = useState('Client');
  const [selectedUserEid, setSelectedUserEid] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick-Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Expand/Collapse state
  const [isExpanded, setIsExpanded] = useState(true);

  // Audit log drawer state
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);

  // Modern delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);

  const tiers = ['Client', 'Manager', 'Team Lead', 'Quality Analyst', 'Agents'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('employee_name', { ascending: true });

      if (usersError) throw usersError;
      if (usersData) setUsers(usersData);

      const { data: nodesData, error: nodesError } = await supabase
        .from('team_hierarchy')
        .select('*');

      if (nodesError && nodesError.code !== '42P01') {
        throw nodesError;
      }

      if (nodesData) setHierarchyNodes(nodesData);

      // Fetch audit logs if table exists
      const { data: logsData, error: logsError } = await supabase
        .from('hierarchy_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!logsError && logsData) {
        setAuditLogs(logsData);
      }
    } catch (err) {
      console.error('Error loading profile data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logAction = async (actionText) => {
    try {
      await supabase.from('hierarchy_audit_logs').insert([{
        action: actionText,
        performed_by: currentUser?.employee_name || currentUser?.email || 'Admin',
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      // Fail silently if audit table hasn't been provisioned yet
      console.log('Audit log table optional notice:', err.message);
    }
  };

  const handleAddNode = async (tierName) => {
    if (!selectedUserEid) return;
    const chosenUser = users.find(u => u.eid === selectedUserEid);
    if (!chosenUser) return;

    const requiresParent = tierName === 'Agents' || tierName === 'Quality Analyst';
    if (requiresParent && !selectedParentId) {
      alert('Please select a parent Team Lead for this member.');
      return;
    }

    try {
      const newNode = {
        tier: tierName,
        eid: chosenUser.eid,
        name: chosenUser.employee_name,
        department: chosenUser.department || 'N/A',
        parent_id: requiresParent ? parseInt(selectedParentId) : null
      };

      const { error } = await supabase
        .from('team_hierarchy')
        .insert([newNode]);

      if (error) throw error;

      await logAction(`Added ${chosenUser.employee_name} (${chosenUser.eid}) to tier ${tierName}`);

      setSelectedUserEid('');
      setSelectedParentId('');
      await fetchData();
    } catch (err) {
      console.error('Error adding node:', err.message);
    }
  };

  const confirmDeleteNode = (id) => {
    const node = hierarchyNodes.find(n => n.id === id);
    setNodeToDelete(node || { id });
    setDeleteModalOpen(true);
  };

  const executeDeleteNode = async () => {
    if (!nodeToDelete) return;
    try {
      const { error } = await supabase
        .from('team_hierarchy')
        .delete()
        .eq('id', nodeToDelete.id);

      if (error) throw error;

      await logAction(`Removed ${nodeToDelete.name || 'User'} from hierarchy`);

      setDeleteModalOpen(false);
      setNodeToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting node:', err.message);
    }
  };

  // FIX: Instead of filtering out non-matching nodes (which completely broke the layout tree and 
  // hid parent Team Leads when searching for sub-agents), we keep all nodes so the tree structure 
  // remains intact, and instead pass down search matching flags/terms for visual highlighting.
  const clients = hierarchyNodes.filter(n => n.tier === 'Client');
  const managers = hierarchyNodes.filter(n => n.tier === 'Manager');
  const teamLeads = hierarchyNodes.filter(n => n.tier === 'Team Lead');
  const qualityAnalysts = hierarchyNodes.filter(n => n.tier === 'Quality Analyst');
  const agents = hierarchyNodes.filter(n => n.tier === 'Agents');

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#ffffff',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    subtleBg: isDarkMode ? '#111827' : '#f8fafc',
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    badgeBg: isDarkMode ? '#334155' : '#f1f5f9',
    badgeText: isDarkMode ? '#cbd5e1' : '#475569',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Top Controller Box & Quick Search Header Bar */}
      <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.textMain }}>Assign Team Members to Organizational Tiers</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick-Search & Filter Bar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color={theme.textMuted} style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Search name or ID (e.g., CXI12585)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', background: theme.inputBg, color: theme.textMain, width: '240px', outline: 'none' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px' }}>×</button>
              )}
            </div>

            {/* Expand / Collapse All Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: theme.subtleBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              title={isExpanded ? 'Collapse Sub-groups' : 'Expand All'}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{isExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>

            {/* Audit Log Drawer Trigger Button */}
            <button
              onClick={() => setAuditDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: theme.subtleBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              <History size={14} />
              <span>Audit Log</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted }}>Select Tier Level</label>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setSelectedParentId('');
              }}
              style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', background: theme.inputBg, color: theme.textMain, fontWeight: '600', outline: 'none' }}
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '240px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted }}>Choose User</label>
            <select
              value={selectedUserEid}
              onChange={(e) => setSelectedUserEid(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', background: theme.inputBg, color: theme.textMain, outline: 'none' }}
            >
              <option value="">-- Select Employee --</option>
              {users.map(user => (
                <option key={user.id} value={user.eid}>
                  {user.employee_name} ({user.eid}) - {user.department || 'No Dept'}
                </option>
              ))}
            </select>
          </div>

          {(selectedTier === 'Agents' || selectedTier === 'Quality Analyst') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '240px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted }}>Reports To (Team Lead)</label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', background: theme.inputBg, color: theme.textMain, outline: 'none' }}
              >
                <option value="">-- Select Team Lead --</option>
                {teamLeads.map(tl => (
                  <option key={tl.id} value={tl.id}>{tl.name} ({tl.eid})</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => handleAddNode(selectedTier)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', height: '41px' }}
          >
            <Plus size={16} />
            <span>Add to {selectedTier}</span>
          </button>
        </div>
      </div>

      {/* Organizational Chart Display */}
      <div style={{ background: theme.cardBg, padding: '40px 20px', borderRadius: '16px', border: `1px solid ${theme.border}`, width: '100%', boxSizing: 'border-box', boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '24px' }}>
          
          {/* CLIENT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: isDarkMode ? '#334155' : '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Client ({clients.length})</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {clients.map(node => (
                <OrgCard key={node.id} node={node} onDelete={confirmDeleteNode} isDarkMode={isDarkMode} theme={theme} searchTerm={searchTerm} />
              ))}
            </div>
            {clients.length > 0 && <div style={{ width: '2px', height: '24px', background: theme.inputBorder, marginTop: '14px' }} />}
          </div>

          {/* MANAGER */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: isDarkMode ? '#334155' : '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Manager ({managers.length})</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {managers.map(node => (
                <OrgCard key={node.id} node={node} onDelete={confirmDeleteNode} isDarkMode={isDarkMode} theme={theme} searchTerm={searchTerm} />
              ))}
            </div>
            {managers.length > 0 && <div style={{ width: '2px', height: '24px', background: theme.inputBorder, marginTop: '14px' }} />}
          </div>

          {/* TEAM LEADS, QUALITY ANALYSTS & ASSIGNED TEAMS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: isDarkMode ? '#334155' : '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Team Leads, Quality Analysts & Assigned Teams</div>
            
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {teamLeads.length > 0 ? (
                teamLeads.map(tl => {
                  const subAgents = agents.filter(a => a.parent_id === tl.id);
                  const subQAs = qualityAnalysts.filter(qa => qa.parent_id === tl.id);
                  
                  const agentsByDept = subAgents.reduce((acc, agent) => {
                    const dept = agent.department || 'General';
                    if (!acc[dept]) acc[dept] = [];
                    acc[dept].push(agent);
                    return acc;
                  }, {});

                  const isTlMatch = searchTerm && (
                    tl.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tl.eid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tl.department?.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  return (
                    <div key={tl.id} style={{ 
                      background: theme.subtleBg, 
                      border: `2px solid ${isTlMatch ? '#2563eb' : (isDarkMode ? '#475569' : '#64748b')}`, 
                      boxShadow: isTlMatch ? (isDarkMode ? '0 0 15px rgba(37, 99, 235, 0.4)' : '0 0 15px rgba(37, 99, 235, 0.25)') : (isDarkMode ? 'none' : '0 6px 12px rgba(0,0,0,0.04)'),
                      borderRadius: '14px', 
                      padding: '18px', 
                      flex: '1 1 340px', 
                      maxWidth: '450px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      
                      {/* Team Lead Profile */}
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: isDarkMode ? '#1e3a8a' : '#e0f2fe', color: isDarkMode ? '#93c5fd' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: `2px solid ${isDarkMode ? '#3b82f6' : '#bae6fd'}` }}>
                        <User size={26} />
                      </div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: theme.textMain, textAlign: 'center' }}>
                        <HighlightText text={tl.name} highlight={searchTerm} />
                      </h4>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isDarkMode ? '#60a5fa' : '#2563eb' }}>
                        <HighlightText text={tl.eid} highlight={searchTerm} />
                      </span>
                      <span style={{ background: isDarkMode ? '#1e3a8a' : '#eff6ff', color: isDarkMode ? '#93c5fd' : '#2563eb', padding: '2px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', margin: '6px 0 10px 0' }}>
                        <HighlightText text={tl.department} highlight={searchTerm} />
                      </span>
                      
                      <button onClick={() => confirmDeleteNode(tl.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '14px' }}>
                        <Trash2 size={12} /> Remove TL
                      </button>

                      {/* Sub-Components Container (Collapsible) */}
                      {isExpanded && (
                        <div style={{ width: '100%', borderTop: `2px dashed ${theme.inputBorder}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          
                          {/* Quality Analysts Section */}
                          {subQAs.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: theme.textMain, textTransform: 'uppercase', textAlign: 'left' }}>Quality Analysts ({subQAs.length})</span>
                              {subQAs.map(qa => {
                                const isQaMatch = searchTerm && (
                                  qa.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  qa.eid?.toLowerCase().includes(searchTerm.toLowerCase())
                                );
                                return (
                                  <div key={qa.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '6px 8px', 
                                    background: theme.cardBg, 
                                    borderRadius: '8px', 
                                    border: `2px solid ${isQaMatch ? '#2563eb' : theme.inputBorder}`,
                                    boxShadow: isQaMatch ? (isDarkMode ? '0 0 10px rgba(37, 99, 235, 0.3)' : '0 0 10px rgba(37, 99, 235, 0.2)') : 'none'
                                  }}>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMain }}>
                                        <HighlightText text={qa.name} highlight={searchTerm} />
                                      </div>
                                      <div style={{ fontSize: '10px', color: isDarkMode ? '#60a5fa' : '#2563eb', fontWeight: '700' }}>
                                        <HighlightText text={qa.eid} highlight={searchTerm} />
                                      </div>
                                    </div>
                                    <button onClick={() => confirmDeleteNode(qa.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Remove QA">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: subQAs.length > 0 ? '6px' : '0' }}>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: theme.textMain, textTransform: 'uppercase' }}>Sub-Agents</span>
                            <span style={{ background: theme.badgeBg, color: theme.badgeText, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>{subAgents.length} Total</span>
                          </div>
                          
                          {Object.keys(agentsByDept).length > 0 ? (
                            Object.entries(agentsByDept).map(([deptName, deptAgents]) => (
                              <div key={deptName} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: theme.cardBg, padding: '12px', borderRadius: '10px', border: `2px solid ${theme.inputBorder}`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: `2px solid ${theme.border}`, paddingBottom: '6px', marginBottom: '4px' }}>
                                  <FolderGit2 size={14} color={isDarkMode ? '#60a5fa' : '#0284c7'} />
                                  <span style={{ fontSize: '11px', fontWeight: '900', color: theme.textMain, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    <HighlightText text={deptName} highlight={searchTerm} />
                                  </span>
                                  <span style={{ marginLeft: 'auto', background: isDarkMode ? '#1e3a8a' : '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                                    {deptAgents.length}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {deptAgents.map(agent => {
                                    const isAgentMatch = searchTerm && (
                                      agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      agent.eid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      agent.department?.toLowerCase().includes(searchTerm.toLowerCase())
                                    );
                                    return (
                                      <div key={agent.id} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '6px 6px', 
                                        borderBottom: `1px solid ${theme.border}`,
                                        borderRadius: '6px',
                                        background: isAgentMatch ? (isDarkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)') : 'transparent',
                                        border: isAgentMatch ? '1px solid #2563eb' : `1px solid transparent`
                                      }}>
                                        <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                                          <div style={{ fontSize: '11px', fontWeight: '800', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <HighlightText text={agent.name} highlight={searchTerm} />
                                          </div>
                                          <div style={{ fontSize: '10px', color: isDarkMode ? '#60a5fa' : '#2563eb', fontWeight: '700' }}>
                                            <HighlightText text={agent.eid} highlight={searchTerm} />
                                          </div>
                                        </div>
                                        <button onClick={() => confirmDeleteNode(agent.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Remove Agent">
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: '11px', color: theme.textMuted, fontStyle: 'italic', textAlign: 'left', padding: '6px' }}>No agents assigned yet.</div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '10px', color: theme.textMuted, fontSize: '12px' }}>No Team Leads added yet.</div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* History / Audit Log Drawer */}
      {auditDrawerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          maxWidth: '100vw',
          height: '100vh',
          background: theme.cardBg,
          color: theme.textMain,
          boxShadow: '-10px 0 25px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${theme.border}`,
          boxSizing: 'border-box'
        }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Hierarchy Audit Trail</h3>
            </div>
            <button onClick={() => setAuditDrawerOpen(false)} style={{ background: theme.subtleBg, border: `1px solid ${theme.border}`, borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, cursor: 'pointer' }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <div key={log.id || index} style={{ background: theme.subtleBg, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: '700', color: theme.textMain }}>{log.action}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textMuted, fontSize: '10px' }}>
                    <span>By: {log.performed_by}</span>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: theme.textMuted, fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
                No recent history logs available yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: theme.cardBg,
            color: theme.textMain,
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            boxSizing: 'border-box',
            margin: '0 16px'
          }}>
            {/* Close Icon */}
            <button
              onClick={() => setDeleteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: theme.subtleBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.textMuted,
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            {/* Warning Icon Banner */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isDarkMode ? '#450a0a' : '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: `2px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`
            }}>
              <AlertTriangle size={28} />
            </div>

            {/* Title & Description */}
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: theme.textMain }}>
              Unassign User?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.5' }}>
              Are you sure you want to unassign <strong style={{ color: theme.textMain }}>{nodeToDelete?.name || 'this user'}</strong> from Team Lead / organizational tier? This action can be undone by re-adding them later.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.inputBorder}`,
                  background: theme.subtleBg,
                  color: theme.textMain,
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteNode}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)'
                }}
              >
                Yes, Unassign
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Utility component to render search keyword highlighting safely
function HighlightText({ text, highlight }) {
  if (!highlight || !text) return text;
  const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: '#facc15', color: '#0f172a', padding: '0 2px', borderRadius: '2px', fontWeight: 'inherit' }}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function OrgCard({ node, onDelete, isDarkMode, theme, searchTerm }) {
  const isMatch = searchTerm && (
    node.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.eid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ 
      background: theme.subtleBg, 
      border: `2px solid ${isMatch ? '#2563eb' : theme.inputBorder}`, 
      boxShadow: isMatch ? (isDarkMode ? '0 0 15px rgba(37, 99, 235, 0.4)' : '0 0 15px rgba(37, 99, 235, 0.25)') : (isDarkMode ? 'none' : '0 4px 6px rgba(0,0,0,0.02)'),
      borderRadius: '12px', 
      padding: '16px', 
      width: '200px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      textAlign: 'center',
      transition: 'all 0.2s ease-in-out'
    }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isDarkMode ? '#1e3a8a' : '#e0f2fe', color: isDarkMode ? '#93c5fd' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: `2px solid ${isDarkMode ? '#3b82f6' : '#bae6fd'}` }}>
        <User size={24} />
      </div>
      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: theme.textMain, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <HighlightText text={node.name} highlight={searchTerm} />
      </h4>
      <span style={{ fontSize: '11px', fontWeight: '600', color: isDarkMode ? '#60a5fa' : '#2563eb', marginBottom: '4px' }}>
        <HighlightText text={node.eid} highlight={searchTerm} />
      </span>
      <span style={{ background: isDarkMode ? '#1e3a8a' : '#eff6ff', color: isDarkMode ? '#93c5fd' : '#2563eb', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', marginBottom: '10px' }}>
        <HighlightText text={node.department} highlight={searchTerm} />
      </span>
      <button onClick={() => onDelete(node.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Trash2 size={12} /> Remove
      </button>
    </div>
  );
}