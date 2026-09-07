import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Building2, Activity, Clock, ShieldCheck, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';

export default function WorkspaceDashboardDisplay({ onViewMoreLogs, isDarkMode }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [activityStream, setActivityStream] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme helper definitions
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    itemBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderColor: isDarkMode ? '#94a3b8' : '#475569',
    tableBorder: isDarkMode ? '#334155' : '#f1f5f9',
    usersIconBg: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff',
    deptIconBg: isDarkMode ? 'rgba(22, 163, 74, 0.25)' : '#f0fdf4',
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

      const { data: ahtData, error: ahtError } = await supabase
        .from('aht_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ahtError) throw ahtError;

      if (ahtData) {
        const formattedLogs = ahtData.map((item, index) => ({
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
        }));
        setActivityStream(formattedLogs);
      }

      // Fetch upcoming scheduled events for the current month
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const ahtSubscription = supabase
      .channel('public:aht_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aht_logs' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const schedSubscription = supabase
      .channel('public:admin_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_schedules' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(ahtSubscription);
      supabase.removeChannel(schedSubscription);
    };
  }, []);

  const handleViewMore = () => {
    if (onViewMoreLogs) {
      onViewMoreLogs();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Total System Users Card */}
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ width: '56px', height: '56px', background: theme.usersIconBg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total System Users</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '800', color: theme.textMain }}>{totalUsers}</h2>
          </div>
        </div>

        {/* Active Departments Card */}
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: theme.deptIconBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
              <Building2 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Departments</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '700', color: theme.textMain }}>{departments.length} Active</h2>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '60px', overflowY: 'auto' }}>
            {departments.length > 0 ? (
              departments.map((dept, idx) => (
                <span key={idx} style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, color: theme.textMain, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                  {dept}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: theme.textMuted }}>No departments found</span>
            )}
          </div>
        </div>

      </div>

      {/* Upcoming Plotted Events for the Month (Compact View) */}
      <div style={{ background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', overflow: 'hidden', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.textMain }}>Upcoming Plotted Events This Month</h3>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, background: theme.itemBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
            {upcomingEvents.length} Scheduled
          </span>
        </div>

        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((ev) => (
              <div 
                key={ev.id} 
                style={{ 
                  background: theme.itemBg, 
                  border: `1px solid ${theme.border}`, 
                  borderLeft: `3px solid ${ev.color || '#2563eb'}`, 
                  borderRadius: '8px', 
                  padding: '10px 12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '3px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: theme.badgeText, background: theme.badgeBg, padding: '1px 5px', borderRadius: '4px' }}>
                    {ev.date}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</h4>
                {ev.description && (
                  <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.description}</p>
                )}
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '14px', color: theme.textMuted, fontSize: '12px' }}>
              No scheduled events plotted for this month yet.
            </div>
          )}
        </div>
      </div>

      {/* 5 Recent Inputs Activity Stream Section */}
      <div style={{ background: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', overflow: 'hidden', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.textMain }}>5 Recent Employee Inputs (AHT Monitoring Stream)</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', border: `1px solid ${isDarkMode ? 'rgba(248, 113, 113, 0.4)' : '#fecaca'}`, color: isDarkMode ? '#fca5a5' : '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
              RECENT 5
            </div>

            {/* View More Redirect Button */}
            <button
              onClick={handleViewMore}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: theme.viewMoreBg,
                border: `1px solid ${theme.viewMoreBorder}`,
                color: theme.viewMoreText,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.viewMoreHoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.viewMoreBg;
              }}
            >
              <span>View More</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}`, color: theme.tableHeaderColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>No.</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>EID</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Name</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Department</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Cluster</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Input</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Start Time</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>End Time</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>AHT</th>
                <th style={{ padding: '14px 20px', fontWeight: '700' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {activityStream.length > 0 ? (
                activityStream.map((row, index) => (
                  <tr key={row.id || index} style={{ borderBottom: `1px solid ${theme.tableBorder}`, color: theme.textMain, transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: theme.textMuted }}>{row.number}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: theme.textMain }}>{row.eid || 'N/A'}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: theme.textMain }}>{row.name || 'N/A'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: theme.badgeBg, color: theme.badgeText, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        {row.department}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: theme.textMain }}>{row.cluster}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: theme.textMain }}>{row.input || 'N/A'}</td>
                    <td style={{ padding: '14px 20px', color: theme.textMuted }}>{row.start_time || 'N/A'}</td>
                    <td style={{ padding: '14px 20px', color: isDarkMode ? '#4ade80' : '#16a34a', fontWeight: '600' }}>{row.end_time || 'In Progress'}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '700', color: theme.badgeText }}>{row.aht || '00:00'}</td>
                    <td style={{ padding: '14px 20px', color: theme.textMuted, fontSize: '12px' }}>
                      {row.created_at}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
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