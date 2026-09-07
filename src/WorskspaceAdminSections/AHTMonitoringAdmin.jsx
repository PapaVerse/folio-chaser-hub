import { useState, useEffect } from 'react';
import { Clock, Search, Calendar, X, ChevronLeft, ChevronRight, Download, Users, Trash2, AlertTriangle, Loader2, Building, Layers } from 'lucide-react';
import { supabase } from '../supabaseClient'; 
import * as XLSX from 'xlsx';

export default function AHTMonitoringAdmin({ isDarkMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, and Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterEid, setFilterEid] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Selection & Deletion States
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteLog, setTargetDeleteLog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Theme helper definitions aligned with overall application themes
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
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
    iconBoxBg: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff'
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

  // Extract unique employees for the EID dropdown filter
  const uniqueEmployees = Array.from(new Set(logs.map(log => log.eid)))
    .map(eid => {
      const found = logs.find(l => l.eid === eid);
      return { eid, name: found ? found.name : eid };
    });

  // Extract unique departments for filter dropdown
  const uniqueDepartments = Array.from(new Set(logs.map(log => log.department).filter(d => d && d !== 'N/A'))).sort();

  // Extract unique clusters for filter dropdown
  const uniqueClusters = Array.from(new Set(logs.map(log => log.cluster).filter(c => c && c !== 'N/A'))).sort();

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

  // Filter logs based on search query, date, employee, department, and cluster
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

    let matchesEid = true;
    if (filterEid) {
      matchesEid = log.eid === filterEid;
    }

    let matchesDepartment = true;
    if (filterDepartment) {
      matchesDepartment = log.department === filterDepartment;
    }

    let matchesCluster = true;
    if (filterCluster) {
      matchesCluster = log.cluster === filterCluster;
    }

    return matchesSearch && matchesDate && matchesEid && matchesDepartment && matchesCluster;
  });

  // Reset to page 1 whenever filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDate, filterEid, filterDepartment, filterCluster, itemsPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Selection Handlers
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
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllPaginatedSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.includes(l.id));

  // Deletion Actions
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
        // Single delete
        const { error } = await supabase
          .from('aht_logs')
          .delete()
          .eq('id', targetDeleteLog.id);

        if (error) throw error;
      } else {
        // Bulk delete
        const { error } = await supabase
          .from('aht_logs')
          .delete()
          .in('id', selectedIds);

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

  // Export filtered logs to a real .xlsx Excel file
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;

    const dataToExport = filteredLogs.map(log => ({
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

  return (
    <div style={{ background: theme.cardBg, padding: 'clamp(15px, 3vw, 30px)', borderRadius: '16px', border: `1px solid ${theme.border}`, minHeight: '500px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden', boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      
      {/* Header and Controls Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.iconBoxBg, padding: '10px', borderRadius: '10px', color: '#2563eb' }}>
            <Clock size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: theme.textMain, margin: '0 0 2px 0' }}>
              All Employee AHT Monitoring (Admin View)
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>Review, filter, and manage handling times across organizational teams.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={openBulkDeleteModal}
              style={{
                padding: '9px 16px',
                background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2',
                color: '#dc2626',
                border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`,
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
            >
              <Trash2 size={15} /> Delete Selected ({selectedIds.length})
            </button>
          )}

          <button 
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            style={{ 
              padding: '9px 16px', 
              background: filteredLogs.length === 0 ? '#94a3b8' : '#10b981', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '13px', 
              cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', background: theme.filterBarBg, padding: '14px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
        
        {/* Employee Dropdown Filter */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Users size={15} color={theme.textMuted} style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <select 
            value={filterEid} 
            onChange={(e) => setFilterEid(e.target.value)}
            style={{ 
              padding: '8px 12px 8px 32px', 
              borderRadius: '6px', 
              border: `1px solid ${theme.inputBorder}`, 
              outline: 'none', 
              background: theme.inputBg, 
              fontSize: '13px',
              color: filterEid ? theme.textMain : theme.textMuted,
              minWidth: '160px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">All Employees</option>
            {uniqueEmployees.map(emp => (
              <option key={emp.eid} value={emp.eid}>{emp.name} ({emp.eid})</option>
            ))}
          </select>
        </div>

        {/* Department Dropdown Filter */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Building size={15} color={theme.textMuted} style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{ 
              padding: '8px 12px 8px 32px', 
              borderRadius: '6px', 
              border: `1px solid ${theme.inputBorder}`, 
              outline: 'none', 
              background: theme.inputBg, 
              fontSize: '13px',
              color: filterDepartment ? theme.textMain : theme.textMuted,
              minWidth: '160px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Cluster Dropdown Filter */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Layers size={15} color={theme.textMuted} style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <select 
            value={filterCluster} 
            onChange={(e) => setFilterCluster(e.target.value)}
            style={{ 
              padding: '8px 12px 8px 32px', 
              borderRadius: '6px', 
              border: `1px solid ${theme.inputBorder}`, 
              outline: 'none', 
              background: theme.inputBg, 
              fontSize: '13px',
              color: filterCluster ? theme.textMain : theme.textMuted,
              minWidth: '150px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">All Clusters</option>
            {uniqueClusters.map(cluster => (
              <option key={cluster} value={cluster}>{cluster}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Calendar size={15} color={theme.textMuted} style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
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
              color: filterDate ? theme.textMain : theme.textMuted,
              background: theme.inputBg,
              boxSizing: 'border-box'
            }}
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              title="Clear Date Filter"
              style={{ marginLeft: '6px', background: isDarkMode ? '#334155' : '#f1f5f9', border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            >
              <X size={13} color={theme.textMuted} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
          <Search size={15} color={theme.textMuted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px 8px 32px', 
              borderRadius: '6px', 
              border: `1px solid ${theme.inputBorder}`, 
              fontSize: '13px', 
              outline: 'none',
              boxSizing: 'border-box',
              background: theme.inputBg,
              color: theme.inputText
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              style={{ background: 'none', border: 'none', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textMuted }}
            >
              <X size={13} />
            </button>
          )}
        </div>

      </div>

      {/* Scrollable Table Container */}
      <div style={{ maxHeight: '460px', overflowY: 'auto', overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: '8px', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '950px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.theadBg }}>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textMuted }}>
              <th style={{ padding: '12px 16px', background: theme.theadBg, width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={isAllPaginatedSelected}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                />
              </th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>No.</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>EID</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Department</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Cluster</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Input</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Start Time</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>End Time</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>AHT</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted }}>Created At</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', background: theme.theadBg, color: theme.textMuted, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                  Loading enterprise records...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                  {logs.length === 0 
                    ? 'No tracking activity logged across any employee accounts yet.' 
                    : 'No system logs match your selected filter criteria.'}
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${theme.borderLight}`, background: isSelected ? theme.selectedRowBg : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(log.id)}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{log.number}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain, fontWeight: '600' }}>{highlightText(log.eid, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{highlightText(log.name, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{highlightText(log.department, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{highlightText(log.cluster, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain, fontWeight: '500' }}>{highlightText(log.input, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{log.start_time}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>{log.end_time}</td>
                    <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: '700', fontFamily: 'monospace' }}>{highlightText(log.aht, searchQuery)}</td>
                    <td style={{ padding: '12px 16px', color: theme.textMuted, fontSize: '12px' }}>{log.created_at}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => openSingleDeleteModal(log)}
                        style={{ 
                          background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', 
                          border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, 
                          color: '#dc2626', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '12px', 
                          fontWeight: '600' 
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination and Range Selector Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: theme.textMuted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span>Showing {filteredLogs.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries</span>
          {filteredLogs.length !== logs.length && <span>(filtered from {logs.length} total system entries)</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Rows:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, outline: 'none', background: theme.inputBg, color: theme.inputText, fontSize: '13px' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
                background: currentPage === 1 ? (isDarkMode ? '#334155' : '#f1f5f9') : theme.inputBg, 
                color: currentPage === 1 ? theme.textMuted : theme.textMain, 
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <span style={{ fontWeight: '600', color: theme.textMain }}>
              {currentPage}/{totalPages || 1}
            </span>

            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ 
                padding: '6px 10px', 
                borderRadius: '6px', 
                border: `1px solid ${theme.inputBorder}`, 
                background: (currentPage === totalPages || totalPages === 0) ? (isDarkMode ? '#334155' : '#f1f5f9') : theme.inputBg, 
                color: (currentPage === totalPages || totalPages === 0) ? theme.textMuted : theme.textMain, 
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

      {/* Modern Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: theme.modalBg,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            boxSizing: 'border-box',
            textAlign: 'center',
            padding: '30px 24px'
          }}>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2', 
              color: '#dc2626', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 18px auto',
              border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`
            }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
              {targetDeleteLog ? 'Delete AHT Log Entry?' : `Delete ${selectedIds.length} Selected Records?`}
            </h3>

            <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: theme.textMuted, lineHeight: '1.5' }}>
              {targetDeleteLog 
                ? `You are about to remove the tracking record for ${targetDeleteLog.name} (${targetDeleteLog.eid}). This action cannot be undone.`
                : `You are about to delete ${selectedIds.length} checked AHT monitoring logs permanently from the database. This action cannot be undone.`
              }
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                style={{ 
                  flex: 1, 
                  padding: '11px', 
                  background: isDarkMode ? '#334155' : '#f1f5f9', 
                  border: `1px solid ${theme.inputBorder}`, 
                  borderRadius: '10px', 
                  fontWeight: '600', 
                  color: isDarkMode ? '#f8fafc' : '#475569', 
                  cursor: 'pointer', 
                  fontSize: '14px' 
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDelete} 
                disabled={deleting}
                style={{ 
                  flex: 1, 
                  padding: '11px', 
                  background: '#dc2626', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: '600', 
                  cursor: deleting ? 'not-allowed' : 'pointer', 
                  fontSize: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' 
                }}
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}