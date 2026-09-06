import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Layers, User, FolderGit2, AlertTriangle, X } from 'lucide-react';

export default function AdminProfile() {
  const [users, setUsers] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  
  const [selectedTier, setSelectedTier] = useState('Client');
  const [selectedUserEid, setSelectedUserEid] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Error loading profile data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      setDeleteModalOpen(false);
      setNodeToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting node:', err.message);
    }
  };

  const clients = hierarchyNodes.filter(n => n.tier === 'Client');
  const managers = hierarchyNodes.filter(n => n.tier === 'Manager');
  const teamLeads = hierarchyNodes.filter(n => n.tier === 'Team Lead');
  const qualityAnalysts = hierarchyNodes.filter(n => n.tier === 'Quality Analyst');
  const agents = hierarchyNodes.filter(n => n.tier === 'Agents');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Top Controller Box */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Layers size={22} color="#2563eb" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Assign Team Members to Organizational Tiers</h2>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Select Tier Level</label>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setSelectedParentId('');
              }}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#0f172a', fontWeight: '600', outline: 'none' }}
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '240px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Choose User</label>
            <select
              value={selectedUserEid}
              onChange={(e) => setSelectedUserEid(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#0f172a', outline: 'none' }}
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
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Reports To (Team Lead)</label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', color: '#0f172a', outline: 'none' }}
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
      <div style={{ background: '#ffffff', padding: '40px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '24px' }}>
          
          {/* CLIENT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Client ({clients.length})</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {clients.map(node => (
                <OrgCard key={node.id} node={node} onDelete={confirmDeleteNode} />
              ))}
            </div>
            {clients.length > 0 && <div style={{ width: '2px', height: '24px', background: '#cbd5e1', marginTop: '14px' }} />}
          </div>

          {/* MANAGER */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Manager ({managers.length})</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {managers.map(node => (
                <OrgCard key={node.id} node={node} onDelete={confirmDeleteNode} />
              ))}
            </div>
            {managers.length > 0 && <div style={{ width: '2px', height: '24px', background: '#cbd5e1', marginTop: '14px' }} />}
          </div>

          {/* TEAM LEADS & DEPARTMENT GROUPS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Team Leads & Assigned Teams</div>
            
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
              {teamLeads.length > 0 ? (
                teamLeads.map(tl => {
                  const subAgents = agents.filter(a => a.parent_id === tl.id);
                  
                  const agentsByDept = subAgents.reduce((acc, agent) => {
                    const dept = agent.department || 'General';
                    if (!acc[dept]) acc[dept] = [];
                    acc[dept].push(agent);
                    return acc;
                  }, {});

                  return (
                    <div key={tl.id} style={{ background: '#f8fafc', border: '2px solid #64748b', borderRadius: '14px', padding: '18px', flex: '1 1 340px', maxWidth: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                      
                      {/* Team Lead Profile */}
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '2px solid #bae6fd' }}>
                        <User size={26} />
                      </div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>{tl.name}</h4>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>{tl.eid}</span>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', margin: '6px 0 10px 0' }}>{tl.department}</span>
                      
                      <button onClick={() => confirmDeleteNode(tl.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '14px' }}>
                        <Trash2 size={12} /> Remove TL
                      </button>

                      {/* Sub-Agents Container */}
                      <div style={{ width: '100%', borderTop: '2px dashed #cbd5e1', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#334155', textTransform: 'uppercase' }}>Sub-Agents</span>
                          <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>{subAgents.length} Total</span>
                        </div>
                        
                        {Object.keys(agentsByDept).length > 0 ? (
                          Object.entries(agentsByDept).map(([deptName, deptAgents]) => (
                            <div key={deptName} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '4px' }}>
                                <FolderGit2 size={14} color="#0284c7" />
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  {deptName}
                                </span>
                                <span style={{ marginLeft: 'auto', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                                  {deptAgents.length}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {deptAgents.map(agent => (
                                  <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
                                      <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700' }}>{agent.eid}</div>
                                    </div>
                                    <button onClick={() => confirmDeleteNode(agent.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }} title="Remove Agent">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'left', padding: '6px' }}>No agents assigned yet.</div>
                        )}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '10px', color: '#94a3b8', fontSize: '12px' }}>No Team Leads added yet.</div>
              )}
            </div>

          </div>

        </div>
      </div>

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
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
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
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
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
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '2px solid #fecaca'
            }}>
              <AlertTriangle size={28} />
            </div>

            {/* Title & Description */}
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Remove Profile?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong style={{ color: '#0f172a' }}>{nodeToDelete?.name || 'this profile'}</strong> from the organizational tier? This action can be undone by re-adding them later.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
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
                Yes, Remove
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function OrgCard({ node, onDelete }) {
  return (
    <div style={{ background: '#f8fafc', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '16px', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '2px solid #bae6fd' }}>
        <User size={24} />
      </div>
      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</h4>
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>{node.eid}</span>
      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', marginBottom: '10px' }}>{node.department}</span>
      <button onClick={() => onDelete(node.id)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Trash2 size={12} /> Remove
      </button>
    </div>
  );
}