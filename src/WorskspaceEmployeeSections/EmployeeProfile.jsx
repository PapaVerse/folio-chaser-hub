import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Layers, User, FolderGit2 } from 'lucide-react';

export default function EmployeeProfile({ isDarkMode }) {
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    headerIconBg: isDarkMode ? '#172554' : '#eff6ff',
    headerIconColor: isDarkMode ? '#93c5fd' : '#2563eb',
    tierBadgeBg: isDarkMode ? '#0f172a' : '#1e293b',
    tierBadgeColor: '#ffffff',
    nodeCardBg: isDarkMode ? '#0f172a' : '#f8fafc',
    nodeCardBorder: isDarkMode ? '#334155' : '#cbd5e1',
    avatarBg: isDarkMode ? '#172554' : '#e0f2fe',
    avatarColor: isDarkMode ? '#93c5fd' : '#0284c7',
    avatarBorder: isDarkMode ? '#1e3a8a' : '#bae6fd',
    deptBadgeBg: isDarkMode ? '#172554' : '#eff6ff',
    deptBadgeColor: isDarkMode ? '#93c5fd' : '#2563eb',
    connectorColor: isDarkMode ? '#475569' : '#cbd5e1',
    subCardBg: isDarkMode ? '#1e293b' : '#ffffff',
    subCardBorder: isDarkMode ? '#334155' : '#cbd5e1',
    dividerColor: isDarkMode ? '#334155' : '#e2e8f0',
    subAgentDivider: isDarkMode ? '#334155' : '#f1f5f9',
    subAgentTotalBg: isDarkMode ? '#334155' : '#e2e8f0',
    subAgentTotalColor: isDarkMode ? '#f8fafc' : '#334155',
  };

  const fetchData = async () => {
    try {
      setLoading(true);
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

  const clients = hierarchyNodes.filter(n => n.tier === 'Client');
  const managers = hierarchyNodes.filter(n => n.tier === 'Manager');
  const teamLeads = hierarchyNodes.filter(n => n.tier === 'Team Lead');
  const agents = hierarchyNodes.filter(n => n.tier === 'Agents');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Info Banner */}
      <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: theme.headerIconBg, padding: '10px', borderRadius: '10px', color: theme.headerIconColor }}>
          <Layers size={22} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.titleMain }}>Team's Profile Hierarchy</h2>
          <p style={{ margin: 0, fontSize: '12px', color: theme.titleSub }}>View organizational structure, leadership, departments, and assigned team members.</p>
        </div>
      </div>

      {/* Organizational Chart Display */}
      <div style={{ background: theme.cardBg, padding: '40px 20px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.titleSub, fontSize: '14px' }}>Loading organizational chart...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '24px' }}>
            
            {/* CLIENT */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ background: theme.tierBadgeBg, color: theme.tierBadgeColor, padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Client ({clients.length})</div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                {clients.map(node => (
                  <OrgCardViewOnly key={node.id} node={node} theme={theme} />
                ))}
              </div>
              {clients.length > 0 && <div style={{ width: '2px', height: '24px', background: theme.connectorColor, marginTop: '14px' }} />}
            </div>

            {/* MANAGER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ background: theme.tierBadgeBg, color: theme.tierBadgeColor, padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Manager ({managers.length})</div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                {managers.map(node => (
                  <OrgCardViewOnly key={node.id} node={node} theme={theme} />
                ))}
              </div>
              {managers.length > 0 && <div style={{ width: '2px', height: '24px', background: theme.connectorColor, marginTop: '14px' }} />}
            </div>

            {/* TEAM LEADS & DEPARTMENT GROUPS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ background: theme.tierBadgeBg, color: theme.tierBadgeColor, padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Team Leads & Assigned Teams</div>
              
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
                      <div key={tl.id} style={{ background: theme.nodeCardBg, border: `2px solid ${theme.nodeCardBorder}`, borderRadius: '14px', padding: '18px', flex: '1 1 340px', maxWidth: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                        
                        {/* Team Lead Profile */}
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: theme.avatarBg, color: theme.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: `2px solid ${theme.avatarBorder}` }}>
                          <User size={26} />
                        </div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: theme.titleMain, textAlign: 'center' }}>{tl.name}</h4>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: theme.headerIconColor }}>{tl.eid}</span>
                        <span style={{ background: theme.deptBadgeBg, color: theme.deptBadgeColor, padding: '2px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', margin: '6px 0 14px 0' }}>{tl.department}</span>

                        {/* Sub-Agents Container */}
                        <div style={{ width: '100%', borderTop: `2px dashed ${theme.connectorColor}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: theme.titleMain, textTransform: 'uppercase' }}>Sub-Agents</span>
                            <span style={{ background: theme.subAgentTotalBg, color: theme.subAgentTotalColor, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>{subAgents.length} Total</span>
                          </div>
                          
                          {Object.keys(agentsByDept).length > 0 ? (
                            Object.entries(agentsByDept).map(([deptName, deptAgents]) => (
                              <div key={deptName} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: theme.subCardBg, padding: '12px', borderRadius: '10px', border: `2px solid ${theme.subCardBorder}`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: `2px solid ${theme.dividerColor}`, paddingBottom: '6px', marginBottom: '4px' }}>
                                  <FolderGit2 size={14} color={theme.headerIconColor} />
                                  <span style={{ fontSize: '11px', fontWeight: '900', color: theme.titleMain, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    {deptName}
                                  </span>
                                  <span style={{ marginLeft: 'auto', background: theme.headerIconColor, color: '#ffffff', padding: '1px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                                    {deptAgents.length}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {deptAgents.map(agent => (
                                    <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderBottom: `1px solid ${theme.subAgentDivider}` }}>
                                      <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: theme.titleMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
                                        <div style={{ fontSize: '10px', color: theme.headerIconColor, fontWeight: '700' }}>{agent.eid}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: '11px', color: theme.titleSub, fontStyle: 'italic', textAlign: 'left', padding: '6px' }}>No agents assigned yet.</div>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '10px', color: theme.titleSub, fontSize: '12px' }}>No Team Leads found.</div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}

function OrgCardViewOnly({ node, theme }) {
  return (
    <div style={{ background: theme.nodeCardBg, border: `2px solid ${theme.nodeCardBorder}`, borderRadius: '12px', padding: '16px', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.avatarBg, color: theme.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: `2px solid ${theme.avatarBorder}` }}>
        <User size={24} />
      </div>
      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: theme.titleMain, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</h4>
      <span style={{ fontSize: '11px', fontWeight: '600', color: theme.headerIconColor, marginBottom: '4px' }}>{node.eid}</span>
      <span style={{ background: theme.deptBadgeBg, color: theme.deptBadgeColor, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{node.department}</span>
    </div>
  );
}