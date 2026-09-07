import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function ScheduleEmployee({ isDarkMode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Info */}
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
      </div>

      {/* Calendar Grid Container */}
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

    </div>
  );
}