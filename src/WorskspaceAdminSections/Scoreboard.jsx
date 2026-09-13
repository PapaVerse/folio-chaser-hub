import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Award, Upload, Trash2, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Scoreboard({ isDarkMode }) {
  const [scoreboardData, setScoreboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('ranking');
  const [sortDirection, setSortDirection] = useState('asc');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const showAlert = (title, message, type = 'info') => setModalConfig({ isOpen: true, title, message, type, onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });

  useEffect(() => { fetchScoreboards(); }, []);

  const fetchScoreboards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('scoreboards').select('*').order('ranking', { ascending: true, nullsLast: true });
      if (error) throw error;
      if (data) {
        setScoreboardData(data);
        if (data.length > 0) setFileName('Synced from DB');
      }
    } catch (err) {
      console.error('Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedRows = data.map((row) => ({
          eid: String(row['Employee ID (EID)'] || row['Employee ID'] || row['eid'] || '').trim(),
          department: row['DEPARTMENT'] || row['Department'] || row['department'] || '',
          client_name: row['CLIENT NAME'] || row['Client Name'] || row['Employee Name'] || '',
          attendance: parseFloat(row['ATTENDANCE'] || row['Attendance'] || 0),
          weight_attendance: parseFloat(row['WEIGHT'] || row['Weight'] || 0),
          quality: parseFloat(row['QUALITY'] || row['Quality'] || 0),
          weight_quality: parseFloat(row['WEIGHT.1'] || 0),
          productivity_attainment: parseFloat(row['PRODUCTIVITY ATTAINMENT'] || row['Productivity Attainment'] || 0),
          weight_productivity: parseFloat(row['WEIGHT.2'] || 0),
          knowledge_check: parseFloat(row['KNOWLEDGE CHECK'] || row['Knowledge Check'] || 0),
          weight_knowledge: parseFloat(row['WEIGHT.3'] || 0),
          escal: parseInt(row['ESCAL'] || row['Escal'] || 0, 10) || 0,
          escal_pct: parseFloat(row['ESCAL %'] || row['Escal %'] || 0),
          weight_escal: parseFloat(row['WEIGHT.4'] || 0),
          af_ztp: parseInt(row['AF/ZTP'] || row['Af/Ztp'] || 0, 10) || 0,
          overall_score: parseFloat(row['OVERALL SCORE'] || row['Overall Score'] || 0),
          ranking: parseInt(row['RANK'] || row['Rank'] || 0, 10) || null,
          status: row['SC'] || row['Status (SC)'] || row['status'] || 'Fail'
        })).filter(r => r.eid);

        if (formattedRows.length === 0) return showAlert('Error', 'No valid rows found.', 'error');
        setLoading(true);

        const uniqueEids = [...new Set(formattedRows.map(r => r.eid))];
        for (const eid of uniqueEids) {
          const { data: existingUser } = await supabase.from('app_users').select('eid').eq('eid', eid).maybeSingle();
          if (!existingUser) {
            await supabase.from('app_users').insert([{
              eid: eid, password: eid, role: 'employee',
              employee_name: formattedRows.find(r => r.eid === eid)?.client_name || eid,
              department: formattedRows.find(r => r.eid === eid)?.department || ''
            }]);
          }
        }

        await supabase.from('scoreboards').delete().neq('id', 0); 
        const { error: insertError } = await supabase.from('scoreboards').insert(formattedRows);
        if (insertError) throw insertError;

        await fetchScoreboards();
        showAlert('Success', 'Scoreboard successfully synced!', 'success');
      } catch (err) {
        showAlert('Import Failed', err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClearData = () => {
    showConfirm('Clear Data', 'Delete all scoreboard entries? This cannot be undone.', async () => {
      try {
        setLoading(true);
        await supabase.from('scoreboards').delete().neq('id', 0);
        setScoreboardData([]);
        setFileName('');
        showAlert('Cleared', 'All records deleted.', 'success');
      } catch (err) {
        showAlert('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...scoreboardData];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        String(item.eid||'').toLowerCase().includes(q) || String(item.department||'').toLowerCase().includes(q) ||
        String(item.client_name||'').toLowerCase().includes(q) || String(item.status||'').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let valA = a[sortField] ?? ''; let valB = b[sortField] ?? '';
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [scoreboardData, searchQuery, sortField, sortDirection]);

  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text;
    const parts = String(text).split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => part.toLowerCase() === searchQuery.toLowerCase() ? (
      <span key={i} style={{ background: '#facc15', color: '#854d0e', padding: '0 2px', borderRadius: '2px', fontWeight: 'bold' }}>{part}</span>
    ) : part);
  };

  const totalRecords = scoreboardData.length;
  const totalPassed = scoreboardData.filter(item => String(item.status).toUpperCase() === 'PASS').length;
  const passingRate = totalRecords > 0 ? ((totalPassed / totalRecords) * 100).toFixed(1) : 0;

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    surface: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? '#f1f5f9' : '#0f172a',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    hover: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <style>{`
        .compact-table th { position: sticky; top: 0; background: ${isDarkMode ? '#0f172a' : '#f8fafc'}; z-index: 10; box-shadow: 0 1px 0 ${theme.border}; }
        .compact-table tr:hover td { background-color: ${theme.hover}; }
        .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .slim-scroll::-webkit-scrollbar-track { background: transparent; }
        .slim-scroll::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
        .slim-scroll::-webkit-scrollbar-thumb:hover { background: ${theme.muted}; }
      `}</style>

      {/* Header & KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#3b82f6" /> Performance Scoreboard
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: theme.muted }}>{fileName ? `Source: ${fileName}` : 'Import Excel data to generate scoreboard'}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'RECORDS', val: totalRecords, color: theme.text },
            { label: 'PASSED', val: totalPassed, color: '#22c55e' },
            { label: 'FAILED', val: totalRecords - totalPassed, color: '#ef4444' },
            { label: 'PASS RATE', val: `${passingRate}%`, color: '#3b82f6' }
          ].map((kpi, i) => (
            <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px 16px', minWidth: '100px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: theme.muted, letterSpacing: '0.5px' }}>{kpi.label}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: kpi.color, marginTop: '2px' }}>{kpi.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table & Toolbar Container */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: theme.bg }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.muted }} />
            <input 
              type="text" placeholder="Search ID, Name, Dept..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px 28px', color: theme.text, fontSize: '12px', outline: 'none' }}
            />
            {searchQuery && (
              <X size={12} onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.muted, cursor: 'pointer' }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> {loading ? 'Processing...' : 'Import Data'}
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={loading} />
            </label>
            {scoreboardData.length > 0 && (
              <button onClick={handleClearData} style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="slim-scroll" style={{ overflowY: 'auto', flex: 1, maxHeight: 'calc(100vh - 280px)' }}>
          {filteredAndSortedData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: theme.muted }}>
              <FileSpreadsheet size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>{scoreboardData.length ? 'No matches found.' : 'No scoreboard data. Import an Excel file to begin.'}</p>
            </div>
          ) : (
            <table className="compact-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr>
                  {[
                    { label: 'RANK', field: 'ranking' }, { label: 'EMPLOYEE NAME', field: 'client_name' },
                    { label: 'ATTENDANCE', field: 'attendance' }, { label: 'QUALITY', field: 'quality' },
                    { label: 'PROD.', field: 'productivity_attainment' }, { label: 'KNOWLEDGE CHECK', field: 'knowledge_check' },
                    { label: 'ESCAL', field: 'escal' }, { label: 'ESCAL %', field: 'escal_pct' },
                    { label: 'AF/ZTP', field: 'af_ztp' }, { label: 'SCORE', field: 'overall_score' }, { label: 'STATUS', field: 'status' }
                  ].map(col => {
                    const isActive = sortField === col.field;
                    return (
                      <th key={col.field} onClick={() => handleSort(col.field)} style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none', color: theme.muted, fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {col.label}
                          <span style={{ color: isActive ? '#3b82f6' : 'transparent', display: 'flex' }}>
                            {isActive ? (sortDirection === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} style={{ opacity: 0.3, color: theme.text }} />}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, i) => {
                  const isPass = String(row.status).toUpperCase() === 'PASS';
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, color: theme.text }}>
                      <td style={{ padding: '8px 12px', fontWeight: '700' }}>#{highlightMatch(row.ranking || '-')}</td>
                      <td style={{ padding: '8px 12px', fontWeight: '500' }}>{highlightMatch(row.client_name)}</td>
                      <td style={{ padding: '8px 12px' }}>{((Number(row.attendance) || 0) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>{((Number(row.quality) || 0) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>{((Number(row.productivity_attainment) || 0) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>{((Number(row.knowledge_check) || 0) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>{row.escal ?? 0}</td>
                      <td style={{ padding: '8px 12px' }}>{((Number(row.escal_pct) || 0) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}>{row.af_ztp ?? 0}</td>
                      <td style={{ padding: '8px 12px', fontWeight: '700' }}>{((Number(row.overall_score) || 0) * 100).toFixed(2)}%</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', background: isPass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: isPass ? '#22c55e' : '#ef4444' }}>
                          {highlightMatch(String(row.status).toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', width: '360px', padding: '20px', color: theme.text }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalConfig.type === 'success' && <CheckCircle2 size={18} color="#22c55e" />}
                {modalConfig.type === 'error' && <AlertTriangle size={18} color="#ef4444" />}
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{modalConfig.title}</h3>
              </div>
              <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: theme.muted }}>{modalConfig.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {modalConfig.type === 'confirm' && (
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>Cancel</button>
              )}
              <button onClick={() => { const cb = modalConfig.onConfirm; setModalConfig({ ...modalConfig, isOpen: false }); if (cb) cb(); }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}