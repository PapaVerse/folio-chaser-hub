import { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, Search, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

export default function AHTMonitoringEmployee({ currentUser, isDarkMode }) {
  const eid = currentUser?.eid || currentUser?.employee_id || 'EMP001';
  const name = currentUser?.employee_name || currentUser?.name || 'Employee Name';
  const department = currentUser?.department || 'Operations';
  const cluster = currentUser?.cluster || 'Cluster A';

  const STORAGE_SESSION_KEY = `aht_active_session_${eid}`;
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

  // Search, Filter, and Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputBgDisabled: isDarkMode ? '#1e293b' : '#f1f5f9',
    inputBorder: isDarkMode ? '#475569' : '#cbd5e1',
    inputColor: isDarkMode ? '#f8fafc' : '#0f172a',
    activeBoxBg: isDarkMode ? '#172554' : '#eff6ff',
    activeBoxBorder: isDarkMode ? '#1e3a8a' : '#bfdbfe',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableBorder: isDarkMode ? '#334155' : '#e2e8f0',
    tableRowBorder: isDarkMode ? '#273548' : '#f1f5f9',
    tableText: isDarkMode ? '#cbd5e1' : '#334155',
    tableTextMain: isDarkMode ? '#f8fafc' : '#0f172a',
    paginationBg: isDarkMode ? '#1e293b' : '#fff',
    paginationDisabledBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    paginationDisabledColor: isDarkMode ? '#475569' : '#94a3b8',
  };

  // Check and recover interrupted active sessions once on mount
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

  // Keep localStorage updated when session changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, [activeSession]);

  // Timer interval effect when a session is active
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

  // Highlight matching query text helper function
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

  // Extract unique departments and clusters for dynamic filter dropdown options
  const uniqueDepartments = [...new Set(logs.map(log => log.department))];
  const uniqueClusters = [...new Set(logs.map(log => log.cluster))];

  // Filter logs based on search query, selected date, department, and cluster
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aht.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (filterDate) {
      const logDateOnly = new Date(log.raw_created_at).toISOString().split('T')[0];
      matchesDate = logDateOnly === filterDate;
    }

    const matchesDepartment = filterDepartment ? log.department === filterDepartment : true;
    const matchesCluster = filterCluster ? log.cluster === filterCluster : true;

    return matchesSearch && matchesDate && matchesDepartment && matchesCluster;
  });

  // Reset to page 1 whenever filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDate, filterDepartment, filterCluster, itemsPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ background: theme.cardBg, padding: 'clamp(15px, 3vw, 30px)', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, minHeight: '500px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
      
      {/* Top Input & Start Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <input 
            type="text"
            placeholder="Enter tracking reference, ticket, or batch data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={activeSession !== null}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: `1px solid ${theme.inputBorder}`, 
              fontSize: '14px', 
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
            padding: '12px 24px', 
            background: (!inputValue.trim() || activeSession !== null) ? '#94a3b8' : '#2563eb', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: '600', 
            fontSize: '14px', 
            cursor: (!inputValue.trim() || activeSession !== null) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Play size={16} /> Start
        </button>
      </div>

      {/* Ongoing Session Live Card */}
      {activeSession && (
        <div style={{ background: theme.activeBoxBg, border: `1px solid ${theme.activeBoxBorder}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '11px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Input</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: theme.titleMain, wordBreak: 'break-all' }}>{activeSession.input}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Start Time</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: theme.tableText }}>{activeSession.startTime}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: theme.titleSub, display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Elapsed Timer</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: isDarkMode ? '#93c5fd' : '#2563eb', fontFamily: 'monospace' }}>{formatTimer(elapsedSeconds)}</span>
            </div>
          </div>

          <button 
            onClick={handleStop}
            style={{ 
              padding: '10px 20px', 
              background: '#dc2626', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '13px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Square size={15} /> Stop & Save
          </button>
        </div>
      )}

      {/* History Log Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: theme.titleMain, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Clock size={18} color={isDarkMode ? '#93c5fd' : '#2563eb'} /> AHT Activity Log ({name})
          </h3>

          {/* Search, Date, Department, and Cluster Filter Controls */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  padding: '8px 12px 8px 32px', 
                  borderRadius: '6px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  fontSize: '13px', 
                  outline: 'none',
                  width: '180px',
                  boxSizing: 'border-box',
                  background: theme.inputBg,
                  color: theme.inputColor
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  style={{ background: 'none', border: 'none', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.titleSub }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Department Filter Select */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.inputBorder}`,
                fontSize: '13px',
                outline: 'none',
                background: theme.inputBg,
                color: filterDepartment ? theme.titleMain : theme.titleSub
              }}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Cluster Filter Select */}
            <select
              value={filterCluster}
              onChange={(e) => setFilterCluster(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.inputBorder}`,
                fontSize: '13px',
                outline: 'none',
                background: theme.inputBg,
                color: filterCluster ? theme.titleMain : theme.titleSub
              }}
            >
              <option value="">All Clusters</option>
              {uniqueClusters.map((clusterName, idx) => (
                <option key={idx} value={clusterName}>{clusterName}</option>
              ))}
            </select>

            {/* Date Filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Calendar size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ 
                  padding: '7px 12px 7px 32px', 
                  borderRadius: '6px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  fontSize: '13px', 
                  outline: 'none',
                  color: filterDate ? theme.titleMain : theme.titleSub,
                  background: theme.inputBg,
                  boxSizing: 'border-box'
                }}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  title="Clear Date Filter"
                  style={{ marginLeft: '6px', background: theme.inputBgDisabled, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} color={theme.titleSub} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: `1px solid ${theme.tableBorder}`, borderRadius: '8px', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '850px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.tableHeaderBg }}>
              <tr style={{ borderBottom: `1px solid ${theme.tableBorder}`, color: theme.titleSub }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>No.</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>EID</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Department</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Cluster</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Input</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Start Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>End Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>AHT</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.tableHeaderBg }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: theme.titleSub }}>
                    {logs.length === 0 
                      ? 'No completed sessions logged yet for your account. Start a tracking session above.' 
                      : 'No logs match your search or filter criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${theme.tableRowBorder}` }}>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{log.number}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText, fontWeight: '600' }}>{highlightText(log.eid, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{highlightText(log.name, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{highlightText(log.department, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{highlightText(log.cluster, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.titleMain, fontWeight: '500' }}>{highlightText(log.input, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{log.start_time}</td>
                    <td style={{ padding: '12px 16px', color: theme.tableText }}>{log.end_time}</td>
                    <td style={{ padding: '12px 16px', color: isDarkMode ? '#93c5fd' : '#2563eb', fontWeight: '700', fontFamily: 'monospace' }}>{highlightText(log.aht, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.titleSub, fontSize: '12px' }}>{log.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination and Range Selector Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: theme.titleSub }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>Showing {filteredLogs.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries</span>
            {filteredLogs.length !== logs.length && <span>(filtered from {logs.length} total)</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rows:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, color: theme.inputColor, fontSize: '13px' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: currentPage === 1 ? theme.paginationDisabledBg : theme.paginationBg, 
                  color: currentPage === 1 ? theme.paginationDisabledColor : theme.tableText, 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={15} /> Prev
              </button>

              <span style={{ fontWeight: '600', color: theme.titleMain }}>
                {currentPage}/{totalPages || 1}
              </span>

              <button 
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: (currentPage === totalPages || totalPages === 0) ? theme.paginationDisabledBg : theme.paginationBg, 
                  color: (currentPage === totalPages || totalPages === 0) ? theme.paginationDisabledColor : theme.tableText, 
                  cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}