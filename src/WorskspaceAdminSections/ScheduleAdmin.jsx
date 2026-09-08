import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, Plus, Trash2, Edit3, Palette, X, Clock, AlertCircle, LayoutGrid, List } from 'lucide-react';

export default function ScheduleAdmin({ isDarkMode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View mode state ('calendar' or 'table')
  const [viewMode, setViewMode] = useState('calendar');

  // Table filtering & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState('all');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [color, setColor] = useState('#2563eb'); // Default blue
  const [customColor, setCustomColor] = useState('#2563eb'); // Custom color picker state
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Delete Confirmation Modal state
  const [deleteId, setDeleteId] = useState(null);

  // Calendar navigation states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Theme helper definitions
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    itemBg: isDarkMode ? '#0f172a' : '#f8fafc',
    weekendBg: isDarkMode ? '#111827' : '#f8fafc',
    todayBg: isDarkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
    modalBg: isDarkMode ? '#1e293b' : '#fff',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputText: isDarkMode ? '#f8fafc' : '#0f172a',
    badgeBg: isDarkMode ? '#334155' : '#e2e8f0',
    badgeText: isDarkMode ? '#f8fafc' : '#334155',
    navBtnBg: isDarkMode ? '#334155' : '#f1f5f9',
    navBtnColor: isDarkMode ? '#f8fafc' : '#334155',
    emptyCellBg: isDarkMode ? '#111827' : '#f8fafc',
    iconBoxBg: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff',
    tableRowHover: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : '#f8fafc'
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_schedules')
        .select('*');

      if (error && error.code !== '42P01') throw error;
      if (data) setEvents(data);
    } catch (err) {
      console.error('Error fetching schedules:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const schedSubscription = supabase
      .channel('public:admin_schedules_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_schedules' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(schedSubscription);
    };
  }, []);

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title || !date) return;

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('admin_schedules')
          .update({ title, description, date, color })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('admin_schedules')
          .insert([{ title, description, date, color }]);

        if (error) throw error;
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      console.error('Error saving schedule:', err.message);
    }
  };

  const handleEdit = (ev) => {
    setTitle(ev.title);
    setDescription(ev.description || '');
    setDate(ev.date);
    const evColor = ev.color || '#2563eb';
    setColor(evColor);
    setCustomColor(evColor);
    setEditingId(ev.id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('admin_schedules')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchEvents();
    } catch (err) {
      console.error('Error deleting schedule:', err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setColor('#2563eb');
    setCustomColor('#2563eb');
    setEditingId(null);
    setShowModal(false);
  };

  // Calendar Helper Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const colorPresets = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#db2777', '#0891b2'];

  // Filtered events for the Table view
  const filteredTableEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          ev.date.includes(searchQuery);
    const matchesColor = filterColor === 'all' || ev.color === filterColor;
    return matchesSearch && matchesColor;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Actions & View Switcher */}
      <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.iconBoxBg, padding: '10px', borderRadius: '10px', color: '#2563eb' }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>Admin Schedule & Events</h2>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>Manage company deadlines, shifts, and events displayed on the calendar.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Toggle Switcher */}
          <div style={{ display: 'flex', background: theme.inputBg, padding: '4px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}` }}>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{ 
                display: 'flex', 
                alignItem: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                background: viewMode === 'calendar' ? '#2563eb' : 'transparent', 
                color: viewMode === 'calendar' ? '#fff' : theme.textMuted, 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '12px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutGrid size={14} /> Calendar
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ 
                display: 'flex', 
                alignItem: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                background: viewMode === 'table' ? '#2563eb' : 'transparent', 
                color: viewMode === 'table' ? '#fff' : theme.textMuted, 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '12px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <List size={14} /> Table View
            </button>
          </div>

          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {/* Modal / Inline Form for Create & Update */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: theme.modalBg, padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', boxSizing: 'border-box', border: `1px solid ${theme.border}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.textMain }}>{editingId ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>Event Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g., Team Sync Meeting"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Add details or notes..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: theme.textMain, marginBottom: '8px' }}>
                  <Palette size={14} /> Color Indicator
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {colorPresets.map((c) => (
                      <div 
                        key={c}
                        onClick={() => { setColor(c); setCustomColor(c); }}
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: c, 
                          cursor: 'pointer', 
                          border: color === c ? '3px solid #60a5fa' : '2px solid transparent',
                          boxSizing: 'border-box'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: `1px solid ${theme.border}`, paddingLeft: '10px' }}>
                    <input 
                      type="color" 
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setColor(e.target.value);
                      }}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                      title="Choose custom color"
                    />
                    <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Custom</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={resetForm} style={{ padding: '8px 14px', background: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? '#f8fafc' : '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{editingId ? 'Update Event' : 'Save Event'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Popup */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: theme.modalBg, padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', boxSizing: 'border-box', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            
            <div style={{ background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#ffeeec', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#dc2626' }}>
              <AlertCircle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: theme.textMain }}>Delete Event</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.4' }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setDeleteId(null)} 
                style={{ flex: 1, padding: '10px', background: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? '#f8fafc' : '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Conditional Rendering: Calendar View vs Table View */}
      {viewMode === 'calendar' ? (
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          
          {/* Month Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
              {monthNames[month]} {year}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={prevMonth} style={{ padding: '6px 12px', background: theme.navBtnBg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: theme.navBtnColor }}>Prev</button>
              <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 12px', background: theme.navBtnBg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: theme.navBtnColor }}>Today</button>
              <button onClick={nextMonth} style={{ padding: '6px 12px', background: theme.navBtnBg, border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: theme.navBtnColor }}>Next</button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
              <div 
                key={d} 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  color: (index === 0 || index === 6) ? '#94a3b8' : theme.textMuted, 
                  textTransform: 'uppercase' 
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} style={{ minHeight: '100px', background: theme.emptyCellBg, borderRadius: '8px', opacity: 0.3 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const currentDayDate = new Date(year, month, dayNum);
              const dayOfWeek = currentDayDate.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;

              const dayEvents = events.filter(ev => ev.date === dateString);
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              const getBackground = () => {
                if (isToday) return theme.todayBg;
                if (isWeekend) return theme.weekendBg;
                return theme.itemBg;
              };

              return (
                <div 
                  key={dateString} 
                  style={{ 
                    minHeight: '110px', 
                    background: getBackground(), 
                    border: isToday ? '2px solid #2563eb' : `1px solid ${theme.border}`, 
                    borderRadius: '10px', 
                    padding: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: isToday ? '#2563eb' : isWeekend ? '#94a3b8' : theme.textMain }}>{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '800', background: theme.badgeBg, color: theme.badgeText, padding: '1px 5px', borderRadius: '4px' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '75px' }}>
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id}
                        style={{ 
                          background: ev.color || '#2563eb', 
                          color: '#fff', 
                          padding: '4px 6px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '700',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <button onClick={() => handleEdit(ev)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }} title="Edit">
                              <Edit3 size={10} />
                            </button>
                            <button onClick={() => setDeleteId(ev.id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }} title="Delete">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                        {ev.description && (
                          <span style={{ fontSize: '9px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ev.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Table / List View */
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Table Toolbar / Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Search events, notes, or dates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '13px', width: '280px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted }}>Filter Color:</span>
              <select 
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                <option value="all">All Colors</option>
                {colorPresets.map((c, i) => (
                  <option key={c} value={c}>Preset #{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted, fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' }}>
                  <th style={{ padding: '10px 12px' }}>Event Title</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Color</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableEvents.length > 0 ? (
                  filteredTableEvents.map(ev => (
                    <tr 
                      key={ev.id} 
                      style={{ borderBottom: `1px solid ${theme.borderLight}`, color: theme.textMain, transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '12px', fontWeight: '700' }}>{ev.title}</td>
                      <td style={{ padding: '12px', color: theme.textMuted, fontWeight: '600' }}>{ev.date}</td>
                      <td style={{ padding: '12px', color: theme.textMuted, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.description || '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: ev.color || '#2563eb' }} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleEdit(ev)} style={{ background: theme.navBtnBg, border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: theme.navBtnColor }} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeleteId(ev.id)} style={{ background: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: theme.textMuted, fontWeight: '600' }}>
                      No events found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}