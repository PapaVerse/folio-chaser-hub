import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, Plus, Trash2, Edit3, Palette, X, Clock, AlertCircle } from 'lucide-react';

export default function ScheduleAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Actions */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px', color: '#2563eb' }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Admin Schedule & Events</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Manage company deadlines, shifts, and events displayed on the calendar.</p>
          </div>
        </div>

        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Modal / Inline Form for Create & Update */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{editingId ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Event Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g., Team Sync Meeting"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Add details or notes..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
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
                          border: color === c ? '3px solid #0f172a' : '2px solid transparent',
                          boxSizing: 'border-box'
                        }}
                      />
                    ))}
                  </div>

                  {/* Native Custom Color Picker Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid #cbd5e1', paddingLeft: '10px' }}>
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
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Custom</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={resetForm} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{editingId ? 'Update Event' : 'Save Event'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Popup */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', boxSizing: 'border-box', textAlign: 'center' }}>
            
            <div style={{ background: '#ffeeec', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#dc2626' }}>
              <AlertCircle size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Delete Event</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setDeleteId(null)} 
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
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

      {/* Calendar Grid Container */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        
        {/* Month Header controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            {monthNames[month]} {year}
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={prevMonth} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: '#334155' }}>Prev</button>
            <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: '#334155' }}>Today</button>
            <button onClick={nextMonth} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: '#334155' }}>Next</button>
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
                color: (index === 0 || index === 6) ? '#94a3b8' : '#64748b', 
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
            <div key={`empty-${index}`} style={{ minHeight: '100px', background: '#f8fafc', borderRadius: '8px', opacity: 0.4 }} />
          ))}

          {/* Actual days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const currentDayDate = new Date(year, month, dayNum);
            const dayOfWeek = currentDayDate.getDay(); // 0 is Sunday, 6 is Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(dayNum).padStart(2, '0');
            const dateString = `${year}-${formattedMonth}-${formattedDay}`;

            const dayEvents = events.filter(ev => ev.date === dateString);
            const isToday = new Date().toISOString().split('T')[0] === dateString;

            // Determine background color: Today takes precedence, then Weekends are light gray, weekdays are white
            const getBackground = () => {
              if (isToday) return '#eff6ff';
              if (isWeekend) return '#f8fafc';
              return '#ffffff';
            };

            return (
              <div 
                key={dateString} 
                style={{ 
                  minHeight: '110px', 
                  background: getBackground(), 
                  border: isToday ? '2px solid #2563eb' : '1px solid #e2e8f0', 
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
                  <span style={{ fontSize: '12px', fontWeight: '800', color: isToday ? '#2563eb' : isWeekend ? '#64748b' : '#0f172a' }}>{dayNum}</span>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: '#e2e8f0', color: '#334155', padding: '1px 5px', borderRadius: '4px' }}>
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

    </div>
  );
}