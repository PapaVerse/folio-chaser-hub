import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Award, FileSpreadsheet, CheckCircle2, AlertTriangle, X, TrendingUp, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function ScoreboardEmployee({ currentUser, isDarkMode }) {
  const [scoreboardRecord, setScoreboardRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => setModalConfig({ isOpen: true, title, message, type });

  useEffect(() => {
    if (currentUser?.eid) {
      fetchEmployeeScoreboard();
    }
  }, [currentUser]);

  const fetchEmployeeScoreboard = async () => {
    try {
      setLoading(true);
      const eid = String(currentUser.eid).trim();
      const { data, error } = await supabase
        .from('scoreboards')
        .select('*')
        .ilike('eid', eid)
        .maybeSingle();

      if (error) throw error;
      setScoreboardRecord(data || null);
    } catch (err) {
      console.error('Error fetching employee scoreboard:', err.message);
      showAlert('Error', 'Failed to load your scoreboard record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    surface: isDarkMode ? '#0f172a' : '#ffffff',
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    subtleBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
  };

  const isPass = scoreboardRecord && String(scoreboardRecord.status).toUpperCase() === 'PASS';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', fontFamily: 'inherit' }}>
      
      {/* Clean Top Header Card */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text, letterSpacing: '-0.2px' }}>
              Performance Scoreboard
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: theme.muted }}>
              <strong style={{ color: theme.text, fontWeight: '600' }}>{currentUser?.employee_name || currentUser?.eid}</strong> 
              <span style={{ marginLeft: '6px', opacity: '0.7' }}>({currentUser?.eid})</span>
            </p>
          </div>
        </div>
        
        {scoreboardRecord && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', background: isPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isPass ? '#10b981' : '#ef4444', border: `1px solid ${isPass ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            {isPass ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
            {String(scoreboardRecord.status).toUpperCase()}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: theme.muted, fontSize: '13px' }}>
          Loading your metrics...
        </div>
      ) : !scoreboardRecord ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '48px 20px', textAlign: 'center', color: theme.muted }}>
          <FileSpreadsheet size={32} style={{ opacity: 0.4, marginBottom: '10px' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.text, fontWeight: '600' }}>No Scoreboard Record Found</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>No scoreboard data has been linked to EID: {currentUser?.eid}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Left Summary Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Rank Card */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#3b82f6' }} />
              <div style={{ fontSize: '11px', fontWeight: '700', color: theme.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Current Rank</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: theme.text, letterSpacing: '-0.5px' }}>
                  #{scoreboardRecord.ranking || '-'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                  Standing
                </div>
              </div>
            </div>

            {/* Overall Score Card */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#10b981' }} />
              <div style={{ fontSize: '11px', fontWeight: '700', color: theme.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Overall Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: theme.text, letterSpacing: '-0.5px' }}>
                  {scoreboardRecord.overall_score != null ? `${(Number(scoreboardRecord.overall_score) * 100).toFixed(2)}%` : '0.00%'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                  Total
                </div>
              </div>
            </div>

            {/* Department Info */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: theme.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Department</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginTop: '4px' }}>
                {scoreboardRecord.department || 'N/A'}
              </div>
            </div>
          </div>

          {/* Right Metrics Panel */}
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: theme.text, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Core Performance Breakdown
              </h3>
              <span style={{ fontSize: '11px', color: theme.muted, fontWeight: '500' }}>Metrics & Attainment</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Attendance', val: Number(scoreboardRecord.attendance) || 0, display: `${((Number(scoreboardRecord.attendance) || 0) * 100).toFixed(1)}%`, type: 'progress' },
                { label: 'Quality', val: Number(scoreboardRecord.quality) || 0, display: `${((Number(scoreboardRecord.quality) || 0) * 100).toFixed(1)}%`, type: 'progress' },
                { label: 'Productivity Attainment', val: Number(scoreboardRecord.productivity_attainment) || 0, display: `${((Number(scoreboardRecord.productivity_attainment) || 0) * 100).toFixed(1)}%`, type: 'progress' },
                { label: 'Knowledge Check', val: Number(scoreboardRecord.knowledge_check) || 0, display: `${((Number(scoreboardRecord.knowledge_check) || 0) * 100).toFixed(1)}%`, type: 'progress' },
                { label: 'Escalation Rate (ESCAL %)', val: Number(scoreboardRecord.escal_pct) || 0, display: `${((Number(scoreboardRecord.escal_pct) || 0) * 100).toFixed(1)}% (Count: ${scoreboardRecord.escal ?? 0})`, type: 'progress' },
                { label: 'AF / ZTP Occurrences', val: Number(scoreboardRecord.af_ztp) || 0, display: `${scoreboardRecord.af_ztp ?? 0} count`, type: 'badge' }
              ].map((metric, idx) => {
                const percentage = Math.min(Math.max(metric.val * 100, 0), 100);
                return (
                  <div key={idx} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{metric.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: theme.text, fontFamily: 'monospace' }}>{metric.display}</span>
                    </div>
                    {metric.type === 'progress' && (
                      <div style={{ width: '100%', height: '6px', background: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: '#3b82f6', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Modal Notification */}
      {modalConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', width: '340px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', color: theme.text }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalConfig.type === 'error' && <AlertTriangle size={18} color="#ef4444" />}
                {modalConfig.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{modalConfig.title}</h3>
              </div>
              <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: theme.muted, lineHeight: '1.4' }}>{modalConfig.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}