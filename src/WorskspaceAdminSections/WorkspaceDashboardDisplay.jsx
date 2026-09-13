// WorkspaceDashboardDisplay.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Building2, Activity, Clock, ShieldCheck, ArrowRight, Calendar as CalendarIcon, Trophy } from 'lucide-react';

export default function WorkspaceDashboardDisplay({ onViewMoreLogs, isDarkMode }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [activityStream, setActivityStream] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme helper definitions - tuned for a high-density dashboard palette
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    itemBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#111827' : '#f8fafc',
    tableHeaderColor: isDarkMode ? '#94a3b8' : '#475569',
    tableBorder: isDarkMode ? '#273548' : '#f1f5f9',
    usersIconBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    deptIconBg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
    trophyIconBg: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
    badgeBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    badgeText: isDarkMode ? '#60a5fa' : '#2563eb',
    viewMoreBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    viewMoreBorder: isDarkMode ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe',
    viewMoreText: isDarkMode ? '#60a5fa' : '#2563eb',
    viewMoreHoverBg: isDarkMode ? 'rgba(37, 99, 235, 0.35)' : '#dbeafe',
  };

  const fetchDashboardData = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('department');

      if (usersError) throw usersError;

      if (usersData) {
        setTotalUsers(usersData.length);
        const uniqueDepts = [...new Set(usersData.map(u => u.department).filter(Boolean))];
        setDepartments(uniqueDepts);
      }

      // Fetch scoreboard rows directly (eid, department, client_name)
      const { data: boardData, error: boardError } = await supabase
        .from('scoreboards')
        .select('*')
        .order('ranking', { ascending: true })
        .limit(3);

      if (boardError && boardError.code !== '42P01') throw boardError;
      if (boardData) {
        setTopPerformers(boardData);
      }

      const { data: ahtData, error: ahtError } = await supabase
        .from('aht_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ahtError) throw ahtError;

      if (ahtData) {
        const formattedLogs = ahtData.map((item, index) => {
          return {
            id: item.id,
            number: ahtData.length - index,
            eid: item.eid,
            name: item.name,
            department: item.department || 'N/A',
            cluster: item.cluster || 'N/A',
            input: item.input,
            start_time: item.start_time,
            end_time: item.end_time,
            aht: item.aht,
            created_at: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'
          };
        });
        setActivityStream(formattedLogs);
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01`;
      const endOfMonth = `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`;

      const { data: schedData, error: schedError } = await supabase
        .from('admin_schedules')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true });

      if (schedError && schedError.code !== '42P01') throw schedError;
      if (schedData) {
        setUpcomingEvents(schedData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const usersSubscription = supabase
      .channel('public:app_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => fetchDashboardData())
      .subscribe();

    const scoreboardsSubscription = supabase
      .channel('public:scoreboards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboards' }, () => fetchDashboardData())
      .subscribe();

    const ahtSubscription = supabase
      .channel('public:aht_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aht_logs' }, () => fetchDashboardData())
      .subscribe();

    const schedSubscription = supabase
      .channel('public:admin_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_schedules' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(scoreboardsSubscription);
      supabase.removeChannel(ahtSubscription);
      supabase.removeChannel(schedSubscription);
    };
  }, []);

  const handleViewMore = () => {
    if (onViewMoreLogs) onViewMoreLogs();
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return { bg: '#eab308', text: '#ffffff' }; // Gold
    if (rank === 2) return { bg: '#94a3b8', text: '#ffffff' }; // Silver
    if (rank === 3) return { bg: '#b45309', text: '#ffffff' }; // Bronze
    return { bg: theme.itemBg, text: theme.textMain };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Metrics, Top Performers & Events Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        
        {/* Left Column Stack: Metrics Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Total System Users Card */}
          <div style={{ background: theme.cardBg, padding: '14px 16px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: theme.usersIconBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <Users size={20} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total System Users</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '800', color: theme.textMain }}>{totalUsers}</h2>
              </div>
            </div>
          </div>

          {/* Active Departments Card */}
          <div style={{ background: theme.cardBg, padding: '14px 16px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: theme.deptIconBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Departments</span>
                  <h2 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>{departments.length} Active</h2>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '48px', overflowY: 'auto' }}>
              {departments.length > 0 ? (
                departments.map((dept, idx) => {
                  return (
                    <span key={idx} style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, color: theme.textMain, padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600' }}>
                      {dept}
                    </span>
                  );
                })
              ) : (
                <span style={{ fontSize: '11.5px', color: theme.textMuted }}>No departments found</span>
              )}
            </div>
          </div>

        </div>

        {/* Middle Column: Top 3 Performers Card (eid, department, client_name) */}
        <div style={{ background: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={16} color="#eab308" />
              <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: theme.textMain }}>Top 3 Performers</h3>
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#eab308', background: theme.trophyIconBg, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              Rankings
            </span>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '165px', overflowY: 'auto' }}>
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, idx) => {
                const rankNum = performer.ranking || (idx + 1);
                const badgeStyle = getRankBadgeColor(rankNum);
                const overallPct = performer.overall_score != null ? `${(Number(performer.overall_score) * 100).toFixed(2)}%` : '0.00%';
                
                return (
                  <div 
                    key={performer.id || idx} 
                    style={{ 
                      background: theme.itemBg, 
                      border: `1px solid ${theme.border}`, 
                      borderRadius: '6px', 
                      padding: '8px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '8px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: badgeStyle.bg, color: badgeStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>
                        {rankNum}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {performer.client_name || 'Unnamed Client'}
                        </h4>
                        <span style={{ fontSize: '10px', color: theme.textMuted }}>
                          {performer.eid ? `${performer.eid} • ` : ''}{performer.department || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: theme.badgeText, fontFamily: 'monospace', flexShrink: 0 }}>
                      {overallPct}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '11.5px' }}>
                No scoreboard rank data imported yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Plotted Events */}
        <div style={{ background: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={16} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: theme.textMain }}>Upcoming Schedules This Month</h3>
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: theme.textMuted, background: theme.itemBg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
              {upcomingEvents.length} Scheduled
            </span>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '165px', overflowY: 'auto' }}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => {
                return (
                  <div 
                    key={ev.id} 
                    style={{ 
                      background: theme.itemBg, 
                      border: `1px solid ${theme.border}`, 
                      borderLeft: `3px solid ${ev.color || '#2563eb'}`, 
                      borderRadius: '6px', 
                      padding: '8px 10px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: '700', color: theme.badgeText, background: theme.badgeBg, padding: '1px 4px', borderRadius: '3px' }}>
                        {ev.date}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</h4>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '11.5px' }}>
                No scheduled events plotted for this month yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Inputs Activity Stream Section */}
      <div style={{ background: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.textMain }}>Recent Employee Inputs (AHT Monitoring Stream)</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', border: `1px solid ${isDarkMode ? 'rgba(248, 113, 113, 0.4)' : '#fecaca'}`, color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
              RECENT 5
            </div>

            <button
              onClick={handleViewMore}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: theme.viewMoreBg,
                border: `1px solid ${theme.viewMoreBorder}`,
                color: theme.viewMoreText,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <span>View More</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}`, color: theme.tableHeaderColor, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>No.</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>EID</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Name</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Department</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Cluster</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Input</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Start Time</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>End Time</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>AHT</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {activityStream.length > 0 ? (
                activityStream.map((row, index) => {
                  return (
                    <tr key={row.id || index} style={{ borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMain }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: theme.textMuted }}>{row.number}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: theme.textMain }}>{row.eid || 'N/A'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: theme.textMain }}>{row.name || 'N/A'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: theme.badgeBg, color: theme.badgeText, padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '700' }}>
                          {row.department}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: theme.textMain }}>{row.cluster}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: theme.textMain }}>{row.input || 'N/A'}</td>
                      <td style={{ padding: '10px 14px', color: theme.textMuted }}>{row.start_time || 'N/A'}</td>
                      <td style={{ padding: '10px 14px', color: isDarkMode ? '#4ade80' : '#16a34a', fontWeight: '600' }}>{row.end_time || 'In Progress'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '700', color: theme.badgeText }}>{row.aht || '00:00'}</td>
                      <td style={{ padding: '10px 14px', color: theme.textMuted, fontSize: '11px' }}>
                        {row.created_at}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: theme.textMuted, fontSize: '12px' }}>
                    {loading ? 'Loading recent monitoring stream...' : 'No tracking activity logged across any employee accounts yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}