// WorkspaceDashboardEmployeeDisplay.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Calendar as CalendarIcon, Award, UserCheck, TrendingUp, Star } from 'lucide-react';

export default function WorkspaceDashboardEmployeeDisplay({ currentEmployeeEid, isDarkMode }) {
  const [employeeScoreData, setEmployeeScoreData] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme helper definitions for consistent styling
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    itemBg: isDarkMode ? '#0f172a' : '#f8fafc',
    trophyIconBg: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
    badgeBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    badgeText: isDarkMode ? '#60a5fa' : '#2563eb',
    successBg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
    successText: isDarkMode ? '#34d399' : '#059669',
  };

  const fetchEmployeeDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch scoreboard entry for the currently logged-in employee if EID is available
      if (currentEmployeeEid) {
        const { data: myData, error: myError } = await supabase
          .from('scoreboards')
          .select('*')
          .eq('eid', currentEmployeeEid)
          .maybeSingle();

        if (!myError && myData) {
          setEmployeeScoreData(myData);
        }
      }

      // 2. Fetch Top 3 Performers sorted by ranking
      const { data: boardData, error: boardError } = await supabase
        .from('scoreboards')
        .select('*')
        .order('ranking', { ascending: true })
        .limit(3);

      if (!boardError && boardData) {
        setTopPerformers(boardData);
      }

      // 3. Fetch Upcoming Schedules for the current month
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

      if (!schedError && schedData) {
        setUpcomingEvents(schedData);
      }

    } catch (err) {
      console.error('Error fetching employee dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDashboardData();

    const scoreboardsSubscription = supabase
      .channel('public:scoreboards_employee')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboards' }, () => fetchEmployeeDashboardData())
      .subscribe();

    const schedSubscription = supabase
      .channel('public:admin_schedules_employee')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_schedules' }, () => fetchEmployeeDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(scoreboardsSubscription);
      supabase.removeChannel(schedSubscription);
    };
  }, [currentEmployeeEid]);

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return { bg: '#eab308', text: '#ffffff' };
    if (rank === 2) return { bg: '#94a3b8', text: '#ffffff' };
    if (rank === 3) return { bg: '#b45309', text: '#ffffff' };
    return { bg: theme.itemBg, text: theme.textMain };
  };

  const calculateScorePercentage = (scoreValue) => {
    if (scoreValue == null) return '0.00%';
    const num = Number(scoreValue);
    // Directly multiply decimals (e.g., 1.0765 -> 107.65%)
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Employee Personal Performance Scoreboard Card */}
      <div style={{ background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: theme.badgeBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.badgeText }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.textMain }}>My Performance Scoreboard</h3>
              <span style={{ fontSize: '11px', color: theme.textMuted }}>Personal metrics and evaluation status</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: theme.successText, background: theme.successBg, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            Active Standing
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          {/* Rank Box */}
          <div style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#eab308', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 }}>
              {employeeScoreData?.ranking || '-'}
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Current Rank</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                {employeeScoreData?.ranking ? `Rank #${employeeScoreData.ranking}` : 'Unranked'}
              </h4>
            </div>
          </div>

          {/* Employee Name Box */}
          <div style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: theme.badgeBg, color: theme.badgeText, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Employee Name</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: '800', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employeeScoreData?.client_name || employeeScoreData?.employee_name || currentEmployeeEid || 'Logged Employee'}
              </h4>
            </div>
          </div>

          {/* Score Box */}
          <div style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Overall Score</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: theme.badgeText, fontFamily: 'monospace' }}>
                {calculateScorePercentage(employeeScoreData?.overall_score ?? employeeScoreData?.score)}
              </h4>
            </div>
          </div>

          {/* Status Box */}
          <div style={{ background: theme.itemBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Star size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Status</span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: '800', color: theme.textMain }}>
                {employeeScoreData?.status || 'Evaluated'}
              </h4>
            </div>
          </div>

        </div>
      </div>

      {/* Grid for Top 3 Performers and Upcoming Schedules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Top 3 Performers Component */}
        <div style={{ background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#eab308" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.textMain }}>Top 3 Performers</h3>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#eab308', background: theme.trophyIconBg, padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              Leaderboard
            </span>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, idx) => {
                const rankNum = performer.ranking || (idx + 1);
                const badgeStyle = getRankBadgeColor(rankNum);
                const scorePct = calculateScorePercentage(performer.overall_score ?? performer.score);

                return (
                  <div 
                    key={performer.id || idx} 
                    style={{ 
                      background: theme.itemBg, 
                      border: `1px solid ${theme.border}`, 
                      borderRadius: '8px', 
                      padding: '10px 12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '8px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: badgeStyle.bg, color: badgeStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>
                        {rankNum}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {performer.client_name || performer.employee_name || 'Unnamed Performer'}
                        </h4>
                        <span style={{ fontSize: '10px', color: theme.textMuted }}>
                          {performer.eid ? `${performer.eid} • ` : ''}{performer.department || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: theme.badgeText, fontFamily: 'monospace', flexShrink: 0 }}>
                      {scorePct}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '12px' }}>
                {loading ? 'Loading scoreboard...' : 'No top performer rankings available yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Schedules This Month Component */}
        <div style={{ background: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.textMain }}>Upcoming Schedules This Month</h3>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, background: theme.itemBg, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
              {upcomingEvents.length} Events
            </span>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => (
                <div 
                  key={ev.id} 
                  style={{ 
                    background: theme.itemBg, 
                    border: `1px solid ${theme.border}`, 
                    borderLeft: `3px solid ${ev.color || '#2563eb'}`, 
                    borderRadius: '6px', 
                    padding: '8px 12px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: theme.badgeText, background: theme.badgeBg, padding: '1px 6px', borderRadius: '3px' }}>
                      {ev.date}
                    </span>
                  </div>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '700', color: theme.textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </h4>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '12px' }}>
                No scheduled events plotted for this month.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}