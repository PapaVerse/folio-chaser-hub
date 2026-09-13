// AHTMonitoringEmployee.jsx
import { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, Search, Calendar, X, ChevronLeft, ChevronRight, BarChart2, Layers, Building } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

export default function AHTMonitoringEmployee({ currentUser, isDarkMode }) {
  const eid = currentUser?.eid || currentUser?.employee_id || 'EMP001';
  const name = currentUser?.employee_name || currentUser?.name || 'Employee Name';
  const department = currentUser?.department || 'Operations';
  const cluster = currentUser?.cluster || 'Cluster A';

  const STORAGE_SESSION_KEY = `aht_active_session_${eid}`;
  const STORAGE_VISIBILITY_KEY = 'aht_columns_visibility';
  const hasRecoveredRef = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SESSION_KEY);
    if (saved) {
      const session = JSON.parse(saved);
      const elapsedMs = new Date() - new Date(session.startTimestamp);
      return Math.floor(elapsedMs / 1000);
    }
    return 0;
  });
  const [logs, setLogs] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterFromDateTime, setFilterFromDateTime] = useState('');
  const [filterToDateTime, setFilterToDateTime] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Column Visibility State synced with localStorage
  const defaultColumns = {
    no: true,
    eid: true,
    name: true,
    department: true,
    cluster: true,
    input: true,
    startTime: true,
    endTime: true,
    aht: true,
    createdAt: true
  };

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem(STORAGE_VISIBILITY_KEY);
    return saved ? { ...defaultColumns, ...JSON.parse(saved) } : defaultColumns;
  });

  useEffect(() => {
    const handleVisibilitySync = (e) => {
      if (!e.key || e.key === STORAGE_VISIBILITY_KEY) {
        const saved = localStorage.getItem(STORAGE_VISIBILITY_KEY);
        if (saved) {
          setColumnVisibility({ ...defaultColumns, ...JSON.parse(saved) });
        }
      }
    };

    window.addEventListener('storage', handleVisibilitySync);
    window.addEventListener('columnVisibilityChanged', handleVisibilitySync);

    return () => {
      window.removeEventListener('storage', handleVisibilitySync);
      window.removeEventListener('columnVisibilityChanged', handleVisibilitySync);
    };
  }, []);

  useEffect(() => {
    if (eid && !hasRecoveredRef.current) {
      hasRecoveredRef.current = true;
      checkAndRecoverOrFetchLogs();
    }
  }, [eid]);

  const checkAndRecoverOrFetchLogs = async () => {
    const saved = localStorage.getItem(STORAGE_SESSION_KEY);

    if (saved) {
      localStorage.removeItem(STORAGE_SESSION_KEY);

      const session = JSON.parse(saved);
      const now = new Date();
      const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const elapsedMs = now - new Date(session.startTimestamp);
      const totalSeconds = Math.floor(elapsedMs / 1000);
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const finalAht = hours > 0 
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      const { data: existingData } = await supabase
        .from('aht_logs')
        .select('*')
        .eq('eid', eid);

      const nextNumber = (existingData?.length || 0) + 1;

      const recoveredRecord = {
        number: nextNumber,
        eid: eid,
        name: name,
        department: department,
        cluster: cluster,
        input: session.input,
        start_time: session.startTime,
        end_time: endTimeStr,
        aht: finalAht
      };

      const { error } = await supabase.from('aht_logs').insert([recoveredRecord]);
      if (error) {
        console.error('Error auto-saving recovered session:', error);
      }
      
      setActiveSession(null);
      setElapsedSeconds(0);
    }

    fetchLogs();
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('aht_logs')
      .select('*')
      .eq('eid', eid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AHT logs:', error);
    } else if (data) {
      const formattedLogs = data.map((item, index) => ({
        number: data.length - index,
        eid: item.eid,
        name: item.name,
        department: item.department || 'Operations',
        cluster: item.cluster || 'Cluster A',
        input: item.input,
        start_time: item.start_time,
        end_time: item.end_time,
        aht: item.aht,
        raw_created_at: item.created_at,
        created_at: new Date(item.created_at).toLocaleString()
      }));
      setLogs(formattedLogs);
    }
  };

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, [activeSession]);

  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!inputValue.trim()) return;
    const now = new Date();
    const newSession = {
      input: inputValue,
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      startTimestamp: now.toISOString()
    };
    setActiveSession(newSession);
    setElapsedSeconds(0);
  };

  const handleStop = async () => {
    const now = new Date();
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const finalAht = formatTimer(elapsedSeconds);

    const newDbRecord = {
      number: logs.length + 1,
      eid: eid,
      name: name,
      department: department,
      cluster: cluster,
      input: activeSession.input,
      start_time: activeSession.startTime,
      end_time: endTimeStr,
      aht: finalAht
    };

    const { error } = await supabase.from('aht_logs').insert([newDbRecord]);

    if (error) {
      console.error('Error saving AHT log to Supabase:', error);
    } else {
      fetchLogs();
    }

    setActiveSession(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    setInputValue('');
    setElapsedSeconds(0);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: '#fde047', color: '#0f172a', padding: '0 2px', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aht.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateTime = true;
    if (log.raw_created_at) {
      const logTime = new Date(log.raw_created_at).getTime();
      if (filterFromDateTime) {
        const fromTime = new Date(filterFromDateTime).getTime();
        if (logTime < fromTime) matchesDateTime = false;
      }
      if (filterToDateTime) {
        const toTime = new Date(filterToDateTime).getTime();
        if (logTime > toTime) matchesDateTime = false;
      }
    }

    const matchesDepartment = filterDepartment ? log.department === filterDepartment : true;
    const matchesCluster = filterCluster ? log.cluster === filterCluster : true;

    return matchesSearch && matchesDateTime && matchesDepartment && matchesCluster;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterFromDateTime, filterToDateTime, filterDepartment, filterCluster, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const calculateAverageAHT = () => {
    if (logs.length === 0) return '00:00';
    let totalSecs = 0;
    logs.forEach(log => {
      const parts = log.aht.split(':').map(Number);
      if (parts.length === 3) {
        totalSecs += parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        totalSecs += parts[0] * 60 + parts[1];
      }
    });
    const avgSecs = Math.round(totalSecs / logs.length);
    return formatTimer(avgSecs);
  };

  const todayStr = new Date().toLocaleDateString();
  const totalInputsToday = logs.filter(log => {
    if (!log.raw_created_at) return false;
    return new Date(log.raw_created_at).toLocaleDateString() === todayStr;
  }).length;

  const totalSystemLogs = logs.length;

  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputBgDisabled: isDarkMode ? '#1e293b' : '#f1f5f9',
    inputBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputColor: isDarkMode ? '#f8fafc' : '#0f172a',
    activeBoxBg: isDarkMode ? '#172554' : '#eff6ff',
    activeBoxBorder: isDarkMode ? '#1e3a8a' : '#bfdbfe',
    tableHeaderBg: isDarkMode ? '#111827' : '#f8fafc',
    tableBorder: isDarkMode ? '#334155' : '#e2e8f0',
    tableRowBorder: isDarkMode ? '#273548' : '#f1f5f9',
    tableText: isDarkMode ? '#cbd5e1' : '#334155',
    tableTextMain: isDarkMode ? '#f8fafc' : '#0f172a',
    paginationDisabledBg: isDarkMode ? '#334155' : '#f1f5f9',
    paginationDisabledColor: isDarkMode ? '#64748b' : '#94a3b8',
    statCardBg: isDarkMode ? '#0f172a' : '#f8fafc',
    statCardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    filterBarBg: isDarkMode ? '#0f172a' : '#f8fafc',
  };

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length;

  return (
    <div style={{ background: theme.cardBg, padding: 'clamp(12px, 2vw, 20px)', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, minHeight: '450px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden', boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}>
      
      {/* Compact KPI Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: theme.statCardBg, border: `1px solid ${theme.statCardBorder}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '6px' }}>
            <BarChart2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.titleSub }}>Average AHT</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.titleMain, fontFamily: 'monospace' }}>{calculateAverageAHT()}</div>
          </div>
        </div>

        <div style={{ background: theme.statCardBg, border: `1px solid ${theme.statCardBorder}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '6px' }}>
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.titleSub }}>Inputs Today</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.titleMain }}>{totalInputsToday}</div>
          </div>
        </div>

        <div style={{ background: theme.statCardBg, border: `1px solid ${theme.statCardBorder}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff', color: '#9333ea', padding: '8px', borderRadius: '6px' }}>
            <Building size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.titleSub }}>Total Logs</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.titleMain }}>{totalSystemLogs}</div>
          </div>
        </div>
      </div>

      {/* Top Input & Start Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <input 
            type="text"
            placeholder="Enter tracking reference, ticket, or batch data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={activeSession !== null}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: `1px solid ${theme.inputBorder}`, 
              fontSize: '12.5px', 
              outline: 'none',
              boxSizing: 'border-box',
              background: activeSession !== null ? theme.inputBgDisabled : theme.inputBg,
              color: theme.inputColor
            }}
          />
        </div>

        <button 
          onClick={handleStart}
          disabled={!inputValue.trim() || activeSession !== null}
          style={{ 
            padding: '8px 16px', 
            background: (!inputValue.trim() || activeSession !== null) ? '#94a3b8' : '#2563eb', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: '600', 
            fontSize: '12.5px', 
            cursor: (!inputValue.trim() || activeSession !== null) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Play size={14} /> Start Session
        </button>
      </div>

      {/* Ongoing Session Live Card */}
      {activeSession && (
        <div style={{ background: theme.activeBoxBg, border: `1px solid ${theme.activeBoxBorder}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '10px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Input</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: theme.titleMain, wordBreak: 'break-all' }}>{activeSession.input}</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Start Time</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: theme.tableText }}>{activeSession.startTime}</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Timer</span>
<span 
  style={{ 
    fontSize: '16px', 
    fontWeight: '800', 
    color: isDarkMode ? '#93c5fd' : '#2563eb', 
    fontFamily: 'monospace',
    animation: 'blink 1.5s ease-in-out infinite',
  }}
>
  <style>
    {`
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}
  </style>
  running...
</span>
            </div>
          </div>

          <button 
            onClick={handleStop}
            style={{ 
              padding: '6px 12px', 
              background: '#dc2626', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <Square size={13} /> Stop & Save
          </button>
        </div>
      )}

      {/* History Log Section */}
      <div>
        
        {/* Streamlined Filter Toolbar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', background: theme.filterBarBg, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
          
          <div style={{ position: 'relative', flex: '1 1 140px', minWidth: '130px' }}>
            <Search size={14} color={theme.titleSub} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 28px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputColor }}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.titleSub }}><X size={12} /></button>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
            <Calendar size={14} color={theme.titleSub} />
            <input type="datetime-local" title="From Date & Time" value={filterFromDateTime} onChange={(e) => setFilterFromDateTime(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterFromDateTime ? theme.titleMain : theme.titleSub, fontSize: '12px' }} />
            {filterFromDateTime && <button onClick={() => setFilterFromDateTime('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={theme.titleSub} /></button>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
            <Calendar size={14} color={theme.titleSub} />
            <input type="datetime-local" title="To Date & Time" value={filterToDateTime} onChange={(e) => setFilterToDateTime(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterToDateTime ? theme.titleMain : theme.titleSub, fontSize: '12px' }} />
            {filterToDateTime && <button onClick={() => setFilterToDateTime('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={theme.titleSub} /></button>}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: theme.titleSub, fontWeight: '600' }}>Filtered: {filteredLogs.length} / {logs.length}</span>
          </div>
        </div>

        {/* High-Density Scrollable Table Container */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', border: `1px solid ${theme.tableBorder}`, borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.tableHeaderBg }}>
              <tr style={{ borderBottom: `1px solid ${theme.tableBorder}`, color: theme.titleSub }}>
                {columnVisibility.no && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>No.</th>}
                {columnVisibility.eid && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>EID</th>}
                {columnVisibility.name && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Name</th>}
                {columnVisibility.department && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Department</th>}
                {columnVisibility.cluster && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Cluster</th>}
                {columnVisibility.input && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Input</th>}
                {columnVisibility.startTime && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Start Time</th>}
                {columnVisibility.endTime && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>End Time</th>}
                {columnVisibility.createdAt && <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.tableHeaderBg }}>Created At</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount || 9} style={{ textAlign: 'center', padding: '30px', color: theme.titleSub }}>
                    {logs.length === 0 
                      ? 'No completed sessions logged yet. Start a tracking session above.' 
                      : 'No logs match your search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${theme.tableRowBorder}` }}>
                    {columnVisibility.no && <td style={{ padding: '8px 10px', color: theme.tableText }}>{log.number}</td>}
                    {columnVisibility.eid && <td style={{ padding: '8px 10px', color: theme.tableText, fontWeight: '600' }}>{highlightText(log.eid, searchQuery)}</td>}
                    {columnVisibility.name && <td style={{ padding: '8px 10px', color: theme.tableText }}>{highlightText(log.name, searchQuery)}</td>}
                    {columnVisibility.department && <td style={{ padding: '8px 10px', color: theme.tableText }}>{highlightText(log.department, searchQuery)}</td>}
                    {columnVisibility.cluster && <td style={{ padding: '8px 10px', color: theme.tableText }}>{highlightText(log.cluster, searchQuery)}</td>}
                    {columnVisibility.input && <td style={{ padding: '8px 10px', color: theme.titleMain, fontWeight: '500' }}>{highlightText(log.input, searchQuery)}</td>}
                    {columnVisibility.startTime && <td style={{ padding: '8px 10px', color: theme.tableText }}>{log.start_time}</td>}
                    {columnVisibility.endTime && <td style={{ padding: '8px 10px', color: theme.tableText }}>{log.end_time}</td>}
                    {columnVisibility.createdAt && <td style={{ padding: '8px 10px', color: theme.titleSub, fontSize: '11px' }}>{log.created_at}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination and Range Selector Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: theme.titleSub }}>
          <div>Showing {filteredLogs.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Rows:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, color: theme.inputColor, fontSize: '12px' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: currentPage === 1 ? theme.paginationDisabledBg : theme.inputBg, 
                  color: currentPage === 1 ? theme.paginationDisabledColor : theme.titleMain, 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <span style={{ fontWeight: '600', color: theme.titleMain }}>
                {currentPage}/{totalPages || 1}
              </span>

              <button 
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: (currentPage === totalPages || totalPages === 0) ? theme.paginationDisabledBg : theme.inputBg, 
                  color: (currentPage === totalPages || totalPages === 0) ? theme.paginationDisabledColor : theme.titleMain, 
                  cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}