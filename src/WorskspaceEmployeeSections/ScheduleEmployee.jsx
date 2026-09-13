import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, LayoutGrid, List, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScheduleEmployee({ isDarkMode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // View mode state ('calendar' or 'table')
  const [viewMode, setViewMode] = useState('calendar');

  // Table filtering & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState('all');

  // Calendar navigation states
  const [currentDate, setCurrentDate] = useState(new Date());

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
      .channel('public:admin_schedules_employee')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_schedules' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(schedSubscription);
    };
  }, []);

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

  // Dynamic Theme Colors optimized for layout efficiency & space utilization
  const theme = {
    cardBg: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    borderLight: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    headerIconBg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    headerIconColor: isDarkMode ? '#60a5fa' : '#2563eb',
    navBtnBg: isDarkMode ? '#1e293b' : '#f8fafc',
    navBtnBorder: isDarkMode ? '#334155' : '#cbd5e1',
    navBtnColor: isDarkMode ? '#cbd5e1' : '#334155',
    weekdayColor: isDarkMode ? '#94a3b8' : '#64748b',
    weekendColor: isDarkMode ? '#64748b' : '#94a3b8',
    emptyDayBg: isDarkMode ? '#090d16' : '#fafafa',
    dayDefaultBg: isDarkMode ? '#0f172a' : '#ffffff',
    dayWeekendBg: isDarkMode ? '#0b1120' : '#fcfcfd',
    dayTodayBg: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
    dayTodayBorder: '#3b82f6',
    dayTodayText: '#3b82f6',
    dayNormalText: isDarkMode ? '#f8fafc' : '#0f172a',
    badgeBg: isDarkMode ? '#1e293b' : '#e2e8f0',
    badgeColor: isDarkMode ? '#cbd5e1' : '#475569',
    inputBg: isDarkMode ? '#0b1120' : '#ffffff',
    inputBorder: isDarkMode ? '#1e293b' : '#cbd5e1',
    inputText: isDarkMode ? '#f8fafc' : '#0f172a',
    tableHover: isDarkMode ? '#131c2e' : '#f8fafc'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}>
      
      {/* Compact Header Bar */}
      <div style={{ background: theme.cardBg, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: theme.headerIconBg, padding: '8px', borderRadius: '8px', color: theme.headerIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.titleMain, lineHeight: '1.2' }}>Cluster Schedule & Events</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.titleSub }}>Company deadlines, shifts, and scheduled events.</p>
          </div>
        </div>

        {/* View Toggle Switcher */}
        <div style={{ display: 'flex', background: theme.navBtnBg, padding: '3px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}` }}>
          <button 
            onClick={() => setViewMode('calendar')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              padding: '5px 10px', 
              background: viewMode === 'calendar' ? '#2563eb' : 'transparent', 
              color: viewMode === 'calendar' ? '#fff' : theme.titleSub, 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutGrid size={13} /> Calendar
          </button>
          <button 
            onClick={() => setViewMode('table')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              padding: '5px 10px', 
              background: viewMode === 'table' ? '#2563eb' : 'transparent', 
              color: viewMode === 'table' ? '#fff' : theme.titleSub, 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <List size={13} /> Table View
          </button>
        </div>
      </div>

      {/* Conditional Rendering: Calendar View vs Table View */}
      {viewMode === 'calendar' ? (
        <div style={{ background: theme.cardBg, padding: '16px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}` }}>
          
          {/* Month Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.titleMain }}>
              {monthNames[month]} {year}
            </h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={prevMonth} style={{ padding: '5px 10px', background: theme.navBtnBg, border: `1px solid ${theme.navBtnBorder}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: theme.navBtnColor, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ChevronLeft size={13} /> Prev
              </button>
              <button onClick={() => setCurrentDate(new Date())} style={{ padding: '5px 10px', background: theme.navBtnBg, border: `1px solid ${theme.navBtnBorder}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: theme.navBtnColor }}>
                Today
              </button>
              <button onClick={nextMonth} style={{ padding: '5px 10px', background: theme.navBtnBg, border: `1px solid ${theme.navBtnBorder}`, borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: theme.navBtnColor, display: 'flex', alignItems: 'center', gap: '2px' }}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px', textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
              <div 
                key={d} 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  color: (index === 0 || index === 6) ? theme.weekendColor : theme.weekdayColor, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix (Optimized cell height to eliminate dead whitespace) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Blank spaces for preceding days */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} style={{ minHeight: '85px', background: theme.emptyDayBg, borderRadius: '6px', opacity: 0.3 }} />
            ))}

            {/* Actual days of the month */}
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
                if (isToday) return theme.dayTodayBg;
                if (isWeekend) return theme.dayWeekendBg;
                return theme.dayDefaultBg;
              };

              return (
                <div 
                  key={dateString} 
                  style={{ 
                    minHeight: '85px', 
                    background: getBackground(), 
                    border: isToday ? `1.5px solid ${theme.dayTodayBorder}` : `1px solid ${theme.cardBorder}`, 
                    borderRadius: '6px', 
                    padding: '5px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '3px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: isToday ? theme.dayTodayText : isWeekend ? theme.titleSub : theme.dayNormalText }}>{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '700', background: theme.badgeBg, color: theme.badgeColor, padding: '0 4px', borderRadius: '3px' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '60px' }}>
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id}
                        style={{ 
                          background: ev.color || '#2563eb', 
                          color: '#fff', 
                          padding: '3px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: '600',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>{ev.title}</span>
                        {ev.description && (
                          <span style={{ fontSize: '9px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        <div style={{ background: theme.cardBg, padding: '16px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Table Toolbar / Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={theme.titleSub} style={{ position: 'absolute', left: '10px' }} />
              <input 
                type="text" 
                placeholder="Search events, notes, or dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '12px', width: '260px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: theme.titleSub }}>Color:</span>
              <select 
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.inputText, fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              >
                <option value="all">All Presets</option>
                {colorPresets.map((c, i) => (
                  <option key={c} value={c}>Preset #{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.cardBorder}`, color: theme.titleSub, fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px' }}>
                  <th style={{ padding: '8px 10px' }}>Event Title</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Description</th>
                  <th style={{ padding: '8px 10px', width: '60px', textAlign: 'center' }}>Preset</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableEvents.length > 0 ? (
                  filteredTableEvents.map(ev => (
                    <tr 
                      key={ev.id} 
                      style={{ borderBottom: `1px solid ${theme.borderLight}`, color: theme.titleMain }}
                    >
                      <td style={{ padding: '10px', fontWeight: '600' }}>{ev.title}</td>
                      <td style={{ padding: '10px', color: theme.titleSub, fontWeight: '500', whiteSpace: 'nowrap' }}>{ev.date}</td>
                      <td style={{ padding: '10px', color: theme.titleSub, maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.description || '—'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ev.color || '#2563eb', margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: theme.titleSub, fontWeight: '500' }}>
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