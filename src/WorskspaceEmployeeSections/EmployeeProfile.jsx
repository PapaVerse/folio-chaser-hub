import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Layers, User, FolderGit2, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function EmployeeProfile({ isDarkMode }) {
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick-Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Expand/Collapse state
  const [isExpanded, setIsExpanded] = useState(true);

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
    inputBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    subtleBg: isDarkMode ? '#111827' : '#f8fafc',
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

  // Filter nodes based on Quick-Search input (Matches Name, EID, or Department)
  const filteredNodes = hierarchyNodes.filter(node => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      node.name?.toLowerCase().includes(term) ||
      node.eid?.toLowerCase().includes(term) ||
      node.department?.toLowerCase().includes(term)
    );
  });

  const clients = filteredNodes.filter(n => n.tier === 'Client');
  const managers = filteredNodes.filter(n => n.tier === 'Manager');
  const teamLeads = filteredNodes.filter(n => n.tier === 'Team Lead');
  const qualityAnalysts = filteredNodes.filter(n => n.tier === 'Quality Analyst');
  const agents = filteredNodes.filter(n => n.tier === 'Agents');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Info Banner & Controls Bar */}
      <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: theme.headerIconBg, padding: '10px', borderRadius: '10px', color: theme.headerIconColor }}>
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.titleMain }}>Team's Profile Hierarchy</h2>
              <p style={{ margin: 0, fontSize: '12px', color: theme.titleSub }}>View organizational structure, leadership, departments, and assigned team members.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick-Search & Filter Bar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color={theme.titleSub} style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', background: theme.inputBg, color: theme.titleMain, width: '220px', outline: 'none' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: theme.titleSub, cursor: 'pointer', fontSize: '12px' }}>×</button>
              )}
            </div>

            {/* Expand / Collapse All Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: theme.subtleBg, border: `1px solid ${theme.inputBorder}`, color: theme.titleMain, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              title={isExpanded ? 'Collapse Sub-groups' : 'Expand All'}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{isExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          </div>
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

            {/* TEAM LEADS, QUALITY ANALYSTS & DEPARTMENT GROUPS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ background: theme.tierBadgeBg, color: theme.tierBadgeColor, padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase' }}>Team Leads, Quality Analysts & Assigned Teams</div>
              
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

                    return (
                      <div key={tl.id} style={{ background: theme.nodeCardBg, border: `2px solid ${theme.nodeCardBorder}`, borderRadius: '14px', padding: '18px', flex: '1 1 340px', maxWidth: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                        
                        {/* Team Lead Profile */}
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: theme.avatarBg, color: theme.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: `2px solid ${theme.avatarBorder}` }}>
                          <User size={26} />
                        </div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: theme.titleMain, textAlign: 'center' }}>{tl.name}</h4>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: theme.headerIconColor }}>{tl.eid}</span>
                        <span style={{ background: theme.deptBadgeBg, color: theme.deptBadgeColor, padding: '2px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', margin: '6px 0 14px 0' }}>{tl.department}</span>

                        {/* Sub-Components Container (Collapsible) */}
                        {isExpanded && (
                          <div style={{ width: '100%', borderTop: `2px dashed ${theme.connectorColor}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {/* Quality Analysts Section */}
                            {subQAs.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: theme.titleMain, textTransform: 'uppercase', textAlign: 'left' }}>Quality Analysts ({subQAs.length})</span>
                                {subQAs.map(qa => (
                                  <div key={qa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: theme.subCardBg, borderRadius: '8px', border: `1px solid ${theme.subCardBorder}` }}>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontSize: '11px', fontWeight: '800', color: theme.titleMain }}>{qa.name}</div>
                                      <div style={{ fontSize: '10px', color: theme.headerIconColor, fontWeight: '700' }}>{qa.eid}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: subQAs.length > 0 ? '6px' : '0' }}>
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
                        )}

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