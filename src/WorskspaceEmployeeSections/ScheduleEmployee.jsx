import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, LayoutGrid, List } from 'lucide-react';

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

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    headerIconBg: isDarkMode ? '#1e3a8a' : '#eff6ff',
    headerIconColor: isDarkMode ? '#93c5fd' : '#2563eb',
    navBtnBg: isDarkMode ? '#334155' : '#f1f5f9',
    navBtnColor: isDarkMode ? '#cbd5e1' : '#334155',
    weekdayColor: isDarkMode ? '#94a3b8' : '#64748b',
    weekendColor: isDarkMode ? '#64748b' : '#94a3b8',
    emptyDayBg: isDarkMode ? '#0f172a' : '#f8fafc',
    dayDefaultBg: isDarkMode ? '#1e293b' : '#ffffff',
    dayWeekendBg: isDarkMode ? '#1a2332' : '#f8fafc',
    dayTodayBg: isDarkMode ? '#172554' : '#eff6ff',
    dayTodayBorder: isDarkMode ? '#3b82f6' : '#2563eb',
    dayTodayText: isDarkMode ? '#93c5fd' : '#2563eb',
    dayNormalText: isDarkMode ? '#f8fafc' : '#0f172a',
    badgeBg: isDarkMode ? '#334155' : '#e2e8f0',
    badgeColor: isDarkMode ? '#cbd5e1' : '#334155',
    inputBg: isDarkMode ? '#0f172a' : '#fff',
    inputBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputText: isDarkMode ? '#f8fafc' : '#0f172a',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Info & View Switcher */}
      <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.headerIconBg, padding: '10px', borderRadius: '10px', color: theme.headerIconColor }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: theme.titleMain }}>Cluster Schedule & Events</h2>
            <p style={{ margin: 0, fontSize: '12px', color: theme.titleSub }}>View plotted company deadlines, shifts, and scheduled events.</p>
          </div>
        </div>

        {/* View Toggle Switcher */}
        <div style={{ display: 'flex', background: theme.inputBg, padding: '4px', borderRadius: '8px', border: `1px solid ${theme.inputBorder}` }}>
          <button 
            onClick={() => setViewMode('calendar')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              background: viewMode === 'calendar' ? '#2563eb' : 'transparent', 
              color: viewMode === 'calendar' ? '#fff' : theme.titleSub, 
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
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              background: viewMode === 'table' ? '#2563eb' : 'transparent', 
              color: viewMode === 'table' ? '#fff' : theme.titleSub, 
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
      </div>

      {/* Conditional Rendering: Calendar View vs Table View */}
      {viewMode === 'calendar' ? (
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
          
          {/* Month Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.titleMain }}>
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
                  color: (index === 0 || index === 6) ? theme.weekendColor : theme.weekdayColor, 
                  textTransform: 'uppercase' 
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {/* Blank spaces for preceding days */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} style={{ minHeight: '100px', background: theme.emptyDayBg, borderRadius: '8px', opacity: 0.4 }} />
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
                    minHeight: '110px', 
                    background: getBackground(), 
                    border: isToday ? `2px solid ${theme.dayTodayBorder}` : `1px solid ${theme.cardBorder}`, 
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
                    <span style={{ fontSize: '12px', fontWeight: '800', color: isToday ? theme.dayTodayText : isWeekend ? theme.titleSub : theme.dayNormalText }}>{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '800', background: theme.badgeBg, color: theme.badgeColor, padding: '1px 5px', borderRadius: '4px' }}>
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
                          padding: '5px 8px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '700',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
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
        <div style={{ background: theme.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.titleSub }}>Filter Color:</span>
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
                <tr style={{ borderBottom: `2px solid ${theme.cardBorder}`, color: theme.titleSub, fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' }}>
                  <th style={{ padding: '10px 12px' }}>Event Title</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Color</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableEvents.length > 0 ? (
                  filteredTableEvents.map(ev => (
                    <tr 
                      key={ev.id} 
                      style={{ borderBottom: `1px solid ${theme.borderLight}`, color: theme.titleMain, transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '12px', fontWeight: '700' }}>{ev.title}</td>
                      <td style={{ padding: '12px', color: theme.titleSub, fontWeight: '600' }}>{ev.date}</td>
                      <td style={{ padding: '12px', color: theme.titleSub, maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.description || '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: ev.color || '#2563eb' }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: theme.titleSub, fontWeight: '600' }}>
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