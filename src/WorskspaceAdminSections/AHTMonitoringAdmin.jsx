// AHTMonitoringAdmin.jsx
import { useState, useEffect } from 'react';
import { Clock, Search, Calendar, X, ChevronLeft, ChevronRight, Download, Users, Trash2, AlertTriangle, Loader2, Building, Layers, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../supabaseClient'; 
import * as XLSX from 'xlsx';

export default function AHTMonitoringAdmin({ isDarkMode, isToggled, onToggle }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, and Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterStartTime, setFilterStartTime] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEndTime, setFilterEndTime] = useState('');
  const [filterEid, setFilterEid] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const STORAGE_VISIBILITY_KEY = 'aht_columns_visibility';

  // Toggle state controlling the Employee View's AHT column visibility via localStorage & events
  const [isEmployeeAhtVisible, setIsEmployeeAhtVisible] = useState(() => {
    const saved = localStorage.getItem(STORAGE_VISIBILITY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.aht !== false;
    }
    return true;
  });

  const toggleEmployeeAhtVisibility = () => {
    const nextState = !isEmployeeAhtVisible;
    setIsEmployeeAhtVisible(nextState);
    const saved = localStorage.getItem(STORAGE_VISIBILITY_KEY);
    let currentVisibility = saved ? JSON.parse(saved) : { aht: true };
    currentVisibility.aht = nextState;
    localStorage.setItem(STORAGE_VISIBILITY_KEY, JSON.stringify(currentVisibility));
    window.dispatchEvent(new Event('columnVisibilityChanged'));
  };

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Selection & Deletion States
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteLog, setTargetDeleteLog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Optimized Theme Definitions for Compact UI
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#273548' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    itemBg: isDarkMode ? '#0f172a' : '#ffffff',
    rowHoverBg: isDarkMode ? '#111827' : '#f8fafc',
    selectedRowBg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
    filterBarBg: isDarkMode ? '#0f172a' : '#f8fafc',
    modalBg: isDarkMode ? '#1e293b' : '#fff',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputText: isDarkMode ? '#f8fafc' : '#0f172a',
    theadBg: isDarkMode ? '#111827' : '#f8fafc',
    iconBoxBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    kpiBg: isDarkMode ? '#0f172a' : '#f8fafc'
  };

  useEffect(() => {
    fetchAllLogs();

    const ahtSubscription = supabase
      .channel('public:aht_logs_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aht_logs' }, () => {
        fetchAllLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ahtSubscription);
    };
  }, []);

  const fetchAllLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('aht_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all AHT logs for admin:', error);
    } else if (data) {
      const formattedLogs = data.map((item, index) => ({
        id: item.id,
        number: data.length - index,
        eid: item.eid,
        name: item.name,
        department: item.department || 'N/A',
        cluster: item.cluster || 'N/A',
        input: item.input,
        start_time: item.start_time,
        end_time: item.end_time,
        aht: item.aht,
        raw_created_at: item.created_at,
        created_at: new Date(item.created_at).toLocaleString()
      }));
      setLogs(formattedLogs);
    }
    setLoading(false);
    setSelectedIds([]);
  };

  const uniqueEmployees = Array.from(new Set(logs.map(log => log.eid)))
    .map(eid => {
      const found = logs.find(l => l.eid === eid);
      return { eid, name: found ? found.name : eid };
    });

  const uniqueDepartments = Array.from(new Set(logs.map(log => log.department).filter(d => d && d !== 'N/A'))).sort();
  const uniqueClusters = Array.from(new Set(logs.map(log => log.cluster).filter(c => c && c !== 'N/A'))).sort();

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

  const parseAhtToSeconds = (ahtStr) => {
    if (!ahtStr) return 0;
    const parts = ahtStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return Number(ahtStr) || 0;
  };

  const formatSecondsToAht = (totalSeconds) => {
    const secs = Math.round(totalSeconds);
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainSecs = secs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remainSecs).padStart(2, '0')}`;
  };

  const totalRecordsCount = logs.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const totalInputsToday = logs.filter(log => log.raw_created_at?.split('T')[0] === todayStr).length;
  const activeEmployeesCount = new Set(logs.map(log => log.eid)).size;

  const averageAhtStr = (() => {
    if (logs.length === 0) return '00:00';
    const totalSecs = logs.reduce((acc, log) => acc + parseAhtToSeconds(log.aht), 0);
    return formatSecondsToAht(totalSecs / logs.length);
  })();

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aht.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRange = true;
    if (filterStartDate || filterStartTime || filterEndDate || filterEndTime) {
      const logDateTime = new Date(log.raw_created_at);
      if (filterStartDate) {
        const startDateTimeStr = filterStartTime ? `${filterStartDate}T${filterStartTime}:00` : `${filterStartDate}T00:00:00`;
        if (logDateTime < new Date(startDateTimeStr)) matchesRange = false;
      }
      if (filterEndDate) {
        const endDateTimeStr = filterEndTime ? `${filterEndDate}T${filterEndTime}:59` : `${filterEndDate}T23:59:59`;
        if (logDateTime > new Date(endDateTimeStr)) matchesRange = false;
      }
    }

    let matchesEid = filterEid ? log.eid === filterEid : true;
    let matchesDepartment = filterDepartment ? log.department === filterDepartment : true;
    let matchesCluster = filterCluster ? log.cluster === filterCluster : true;

    return matchesSearch && matchesRange && matchesEid && matchesDepartment && matchesCluster;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === 'aht') {
      aValue = parseAhtToSeconds(a.aht);
      bValue = parseAhtToSeconds(b.aht);
    } else if (sortConfig.key === 'number' || sortConfig.key === 'input') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    } else {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStartDate, filterStartTime, filterEndDate, filterEndTime, filterEid, filterDepartment, filterCluster, itemsPerPage]);

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allPaginatedIds = paginatedLogs.map(l => l.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...allPaginatedIds])));
    } else {
      const paginatedIdsSet = new Set(paginatedLogs.map(l => l.id));
      setSelectedIds(prev => prev.filter(id => !paginatedIdsSet.has(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const isAllPaginatedSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.includes(l.id));

  const openSingleDeleteModal = (log) => {
    setTargetDeleteLog(log);
    setDeleteModalOpen(true);
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.length === 0) return;
    setTargetDeleteLog(null);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      if (targetDeleteLog) {
        const { error } = await supabase.from('aht_logs').delete().eq('id', targetDeleteLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('aht_logs').delete().in('id', selectedIds);
        if (error) throw error;
      }
      await fetchAllLogs();
      setDeleteModalOpen(false);
      setTargetDeleteLog(null);
    } catch (err) {
      console.error('Error deleting logs:', err);
      alert('Failed to delete logs. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportExcel = () => {
    if (sortedLogs.length === 0) return;
    const dataToExport = sortedLogs.map(log => ({
      'No.': log.number,
      'EID': log.eid,
      'Name': log.name,
      'Department': log.department,
      'Cluster': log.cluster,
      'Input': log.input,
      'Start Time': log.start_time,
      'End Time': log.end_time,
      'AHT': log.aht,
      'Created At': log.created_at
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AHT Logs');
    XLSX.writeFile(workbook, `aht_admin_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={12} style={{ opacity: '0.4', marginLeft: '3px' }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} style={{ color: '#2563eb', marginLeft: '3px' }} /> 
      : <ArrowDown size={12} style={{ color: '#2563eb', marginLeft: '3px' }} />;
  };

  const getAhtBadgeStyle = (ahtStr) => {
    const secs = parseAhtToSeconds(ahtStr);
    if (secs < 120) {
      return { bg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5', color: '#059669', border: isDarkMode ? '#065f46' : '#a7f3d0', label: 'Easy' };
    } else if (secs >= 120 && secs <= 300) {
      return { bg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff', color: '#2563eb', border: isDarkMode ? '#1e40af' : '#bfdbfe', label: 'Normal' };
    } else if (secs > 300 && secs <= 900) {
      return { bg: isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7', color: '#d97706', border: isDarkMode ? '#b45309' : '#fde68a', label: 'Hard' };
    } else {
      return { bg: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', color: '#dc2626', border: isDarkMode ? '#7f1d1d' : '#fecaca', label: 'Excessive' };
    }
  };

  return (
    <div style={{ background: theme.cardBg, padding: 'clamp(12px, 2vw, 20px)', borderRadius: '12px', border: `1px solid ${theme.border}`, minHeight: '450px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden', boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}>
      
      {/* Compact Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: theme.iconBoxBg, padding: '8px', borderRadius: '8px', color: '#2563eb' }}>
            <Clock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain, margin: '0 0 1px 0' }}>
              Employee AHT Monitoring Dashboard
            </h3>
            <p style={{ margin: 0, fontSize: '11.5px', color: theme.textMuted }}>Review handling metrics and analyze system logs efficiently.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onToggle && (
            <button
              onClick={onToggle}
              style={{
                padding: '6px 12px',
                background: isToggled ? (isDarkMode ? '#065f46' : '#10b981') : (isDarkMode ? '#334155' : '#e2e8f0'),
                color: isToggled ? '#ffffff' : theme.textMain,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Toggle: {isToggled ? 'ON' : 'OFF'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={openBulkDeleteModal}
              style={{
                padding: '6px 12px',
                background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2',
                color: '#dc2626',
                border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`,
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={13} /> Delete ({selectedIds.length})
            </button>
          )}

          <button 
            onClick={handleExportExcel}
            disabled={sortedLogs.length === 0}
            style={{ 
              padding: '6px 12px', 
              background: sortedLogs.length === 0 ? '#94a3b8' : '#10b981', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              fontSize: '12px', 
              cursor: sortedLogs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Download size={13} /> Export Excel
          </button>
        </div>
      </div>

      {/* Compact KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: theme.kpiBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '6px' }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted }}>Average AHT</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.textMain, fontFamily: 'monospace' }}>{averageAhtStr}</div>
          </div>
        </div>

        <div style={{ background: theme.kpiBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '6px' }}>
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted }}>Inputs Today</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.textMain }}>{totalInputsToday}</div>
          </div>
        </div>

        <div style={{ background: theme.kpiBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7', color: '#d97706', padding: '8px', borderRadius: '6px' }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted }}>Active Staff</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.textMain }}>{activeEmployeesCount}</div>
          </div>
        </div>

        <div style={{ background: theme.kpiBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: isDarkMode ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff', color: '#9333ea', padding: '8px', borderRadius: '6px' }}>
            <Building size={16} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textMuted }}>Filtered/Total</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: theme.textMain }}>{sortedLogs.length} / {totalRecordsCount}</div>
          </div>
        </div>
      </div>

      {/* Streamlined Filter Toolbar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', background: theme.filterBarBg, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Users size={14} color={theme.textMuted} style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
          <select 
            value={filterEid} 
            onChange={(e) => setFilterEid(e.target.value)}
            style={{ padding: '6px 10px 6px 28px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, fontSize: '12px', color: filterEid ? theme.textMain : theme.textMuted }}
          >
            <option value="">All Employees</option>
            {uniqueEmployees.map(emp => (
              <option key={emp.eid} value={emp.eid}>{emp.name} ({emp.eid})</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Building size={14} color={theme.textMuted} style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{ padding: '6px 10px 6px 28px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, fontSize: '12px', color: filterDepartment ? theme.textMain : theme.textMuted }}
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Layers size={14} color={theme.textMuted} style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
          <select 
            value={filterCluster} 
            onChange={(e) => setFilterCluster(e.target.value)}
            style={{ padding: '6px 10px 6px 28px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, fontSize: '12px', color: filterCluster ? theme.textMain : theme.textMuted }}
          >
            <option value="">All Clusters</option>
            {uniqueClusters.map(cluster => <option key={cluster} value={cluster}>{cluster}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
          <Calendar size={14} color={theme.textMuted} />
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterStartDate ? theme.textMain : theme.textMuted, fontSize: '12px' }} />
          <input type="time" value={filterStartTime} onChange={(e) => setFilterStartTime(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterStartTime ? theme.textMain : theme.textMuted, fontSize: '12px' }} />
          {(filterStartDate || filterStartTime) && <button onClick={() => { setFilterStartDate(''); setFilterStartTime(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={theme.textMuted} /></button>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
          <Calendar size={14} color={theme.textMuted} />
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterEndDate ? theme.textMain : theme.textMuted, fontSize: '12px' }} />
          <input type="time" value={filterEndTime} onChange={(e) => setFilterEndTime(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: filterEndTime ? theme.textMain : theme.textMuted, fontSize: '12px' }} />
          {(filterEndDate || filterEndTime) && <button onClick={() => { setFilterEndDate(''); setFilterEndTime(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={theme.textMuted} /></button>}
        </div>

        <div style={{ position: 'relative', flex: '1 1 140px', minWidth: '130px' }}>
          <Search size={14} color={theme.textMuted} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px 6px 28px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, fontSize: '12px', outline: 'none', boxSizing: 'border-box', background: theme.inputBg, color: theme.inputText }}
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textMuted }}><X size={12} /></button>}
        </div>
      </div>

      {/* High-Density Data Table */}
      <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '900px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.theadBg }}>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textMuted }}>
              <th style={{ padding: '8px 10px', background: theme.theadBg, width: '30px', textAlign: 'center' }}>
                <input type="checkbox" checked={isAllPaginatedSelected} onChange={handleSelectAll} style={{ cursor: 'pointer', width: '14px', height: '14px' }} />
              </th>
              <th onClick={() => handleSort('number')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>No. {renderSortIcon('number')}</th>
              <th onClick={() => handleSort('eid')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>EID {renderSortIcon('eid')}</th>
              <th onClick={() => handleSort('name')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Name {renderSortIcon('name')}</th>
              <th onClick={() => handleSort('department')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Dept {renderSortIcon('department')}</th>
              <th onClick={() => handleSort('cluster')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Cluster {renderSortIcon('cluster')}</th>
              <th onClick={() => handleSort('input')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Input {renderSortIcon('input')}</th>
              <th onClick={() => handleSort('start_time')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Start {renderSortIcon('start_time')}</th>
              <th onClick={() => handleSort('end_time')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>End {renderSortIcon('end_time')}</th>
              <th onClick={() => handleSort('aht')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>AHT & Status {renderSortIcon('aht')}</th>
              <th onClick={() => handleSort('created_at')} style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, cursor: 'pointer' }}>Created {renderSortIcon('created_at')}</th>
              <th style={{ padding: '8px 10px', fontWeight: '700', background: theme.theadBg, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}>Loading tracking records...</td></tr>
            ) : paginatedLogs.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}>No system logs found matching criteria.</td></tr>
            ) : (
              paginatedLogs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                const threshold = getAhtBadgeStyle(log.aht);
                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${theme.borderLight}`, background: isSelected ? theme.selectedRowBg : 'transparent' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(log.id)} style={{ cursor: 'pointer', width: '14px', height: '14px' }} />
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{log.number}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain, fontWeight: '600' }}>{highlightText(log.eid, searchQuery)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{highlightText(log.name, searchQuery)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{highlightText(log.department, searchQuery)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{highlightText(log.cluster, searchQuery)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain, fontWeight: '500' }}>{highlightText(log.input, searchQuery)}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{log.start_time}</td>
                    <td style={{ padding: '8px 10px', color: theme.textMain }}>{log.end_time}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: theme.textMain, fontWeight: '700', fontFamily: 'monospace' }}>{highlightText(log.aht, searchQuery)}</span>
                        <span style={{ background: threshold.bg, color: threshold.color, border: `1px solid ${threshold.border}`, fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>{threshold.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: theme.textMuted, fontSize: '11px' }}>{log.created_at}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button 
                        onClick={() => openSingleDeleteModal(log)}
                        style={{ background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, color: '#dc2626', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '600' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: theme.textMuted }}>
        <div>Showing {sortedLogs.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, sortedLogs.length)} of {sortedLogs.length} entries</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Rows:</span>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, color: theme.inputText, fontSize: '12px' }}>
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
              style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, background: currentPage === 1 ? (isDarkMode ? '#334155' : '#f1f5f9') : theme.inputBg, color: currentPage === 1 ? theme.textMuted : theme.textMain, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontWeight: '600', color: theme.textMain }}>{currentPage}/{totalPages || 1}</span>
            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${theme.inputBorder}`, background: (currentPage === totalPages || totalPages === 0) ? (isDarkMode ? '#334155' : '#f1f5f9') : theme.inputBg, color: (currentPage === totalPages || totalPages === 0) ? theme.textMuted : theme.textMain, cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', fontSize: '12px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: theme.modalBg, borderRadius: '12px', width: '100%', maxWidth: '380px', border: `1px solid ${theme.border}`, textAlign: 'center', padding: '24px 20px', boxSizing: 'border-box' }}>
            <div style={{ width: '44px', height: '44px', background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}` }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>
              {targetDeleteLog ? 'Delete AHT Log Entry?' : `Delete ${selectedIds.length} Selected Records?`}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '12.5px', color: theme.textMuted }}>This action is permanent and cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={deleting} style={{ flex: 1, padding: '8px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', fontWeight: '600', color: theme.textMain, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={executeDelete} disabled={deleting} style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}