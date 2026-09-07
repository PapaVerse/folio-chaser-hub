import { useState } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Award, 
  UserPlus, 
  Users, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Info, 
  User as UserIcon,
  ShieldCheck,
  BookOpen,
  Network,
  CalendarDays,
  Sun,
  Moon
} from 'lucide-react';
import CreateUser from './WorskspaceAdminSections/CreateUser';
import ManageUser from './WorskspaceAdminSections/ManageUser';
import AHTMonitoringAdmin from './WorskspaceAdminSections/AHTMonitoringAdmin';
import KnowledgeGuidelineAdmin from './WorskspaceAdminSections/KnowledgeGuidelineAdmin';
import WorkspaceDashboardDisplay from './WorskspaceAdminSections/WorkspaceDashboardDisplay';
import AdminProfile from './WorskspaceAdminSections/AdminProfile';
import ScheduleAdmin from './WorskspaceAdminSections/ScheduleAdmin';

export default function WorkspaceDashboard({ currentUser, onLogout, isDarkMode, toggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');

  const displayName = currentUser?.employee_name || 'Administrator';
  const displayEid = currentUser?.eid || 'ADMIN';

  // Theme styles helper dictionary
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    borderLight: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    activeNavBg: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
    activeNavText: isDarkMode ? '#60a5fa' : '#2563eb',
    inactiveNavText: isDarkMode ? '#94a3b8' : '#64748b',
    hoverNavBg: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : '#f8fafc',
    collapseBtnBg: isDarkMode ? '#334155' : '#f1f5f9',
    collapseBtnText: isDarkMode ? '#cbd5e1' : '#475569',
    userInfoBg: isDarkMode ? '#1e293b' : '#f8fafc',
    adminBadgeBg: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff',
    adminBadgeText: isDarkMode ? '#60a5fa' : '#2563eb',
    userIconBg: isDarkMode ? 'rgba(2, 132, 199, 0.25)' : '#e0f2fe',
    userIconColor: isDarkMode ? '#38bdf8' : '#0284c7',
    signOutBg: isDarkMode ? 'rgba(127, 29, 29, 0.25)' : '#fef2f2',
    signOutText: isDarkMode ? '#fca5a5' : '#dc2626',
    signOutBorder: isDarkMode ? 'rgba(239, 68, 68, 0.4)' : '#fecaca',
  };

  const getNavButtonStyle = (isActive) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    width: '100%', 
    padding: '12px 14px', 
    background: isActive ? theme.activeNavBg : 'transparent', 
    color: isActive ? theme.activeNavText : theme.inactiveNavText, 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: '600', 
    fontSize: '13px', 
    cursor: 'pointer', 
    textAlign: 'left', 
    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box', transition: 'background 0.3s ease' }}>
      
      {/* Sidebar Panel */}
      <div style={{ 
        width: isSidebarOpen ? '260px' : '80px', 
        background: theme.cardBg, 
        borderRight: `1px solid ${theme.border}`, 
        display: 'flex', 
        flexDirection: 'column', 
        transition: 'width 0.3s ease, background 0.3s ease, border-color 0.3s ease',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div style={{ 
          padding: '24px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isSidebarOpen ? 'space-between' : 'center', 
          flexDirection: isSidebarOpen ? 'row' : 'column',
          gap: isSidebarOpen ? '0' : '16px',
          borderBottom: `1px solid ${theme.borderLight}` 
        }}>
          {isSidebarOpen ? (
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.textMain, letterSpacing: '-0.025em' }}>FC HUB</h2>
              <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>Control Center</span>
            </div>
          ) : (
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.textMain, textAlign: 'center' }}>FC</h2>
          )}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ 
              background: theme.collapseBtnBg, 
              border: 'none', 
              borderRadius: '6px', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: theme.collapseBtnText,
              flexShrink: 0
            }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          
          <button onClick={() => setActiveNav('dashboard')} style={getNavButtonStyle(activeNav === 'dashboard')} title={!isSidebarOpen ? "Dashboard" : ""}>
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          <button onClick={() => setActiveNav('schedule')} style={getNavButtonStyle(activeNav === 'schedule')} title={!isSidebarOpen ? "Schedule" : ""}>
            <CalendarDays size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Schedule</span>}
          </button>

          <button onClick={() => setActiveNav('aht-monitoring')} style={getNavButtonStyle(activeNav === 'aht-monitoring')} title={!isSidebarOpen ? "AHT Monitoring" : ""}>
            <Clock size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>AHT Monitoring</span>}
          </button>

          <button onClick={() => setActiveNav('scoreboard')} style={getNavButtonStyle(activeNav === 'scoreboard')} title={!isSidebarOpen ? "Scoreboard" : ""}>
            <Award size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Scoreboard</span>}
          </button>

          <button onClick={() => setActiveNav('knowledge-guidelines')} style={getNavButtonStyle(activeNav === 'knowledge-guidelines')} title={!isSidebarOpen ? "Knowledge Guidelines" : ""}>
            <BookOpen size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>SOP & Guidelines</span>}
          </button>

          <button onClick={() => setActiveNav('admin-profile')} style={getNavButtonStyle(activeNav === 'admin-profile')} title={!isSidebarOpen ? "Team's Profile" : ""}>
            <Network size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Team's Profile</span>}
          </button>

          <div style={{ height: '1px', background: theme.borderLight, margin: '8px 4px' }} />

          <button onClick={() => setActiveNav('create-user')} style={getNavButtonStyle(activeNav === 'create-user')} title={!isSidebarOpen ? "Create User" : ""}>
            <UserPlus size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Create User</span>}
          </button>

          <button onClick={() => setActiveNav('manage-user')} style={getNavButtonStyle(activeNav === 'manage-user')} title={!isSidebarOpen ? "Manage User" : ""}>
            <Users size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Manage User</span>}
          </button>

        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ background: theme.cardBg, padding: '20px 32px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <div>
            <h1 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: '800', color: theme.textMain, textTransform: 'capitalize' }}>
              {activeNav === 'aht-monitoring' ? 'AHT Monitoring' : activeNav === 'knowledge-guidelines' ? 'Knowledge Base & SOP Guidelines' : activeNav === 'admin-profile' ? "Team's Profile Hierarchy" : activeNav === 'schedule' ? 'Schedule & Calendar Events' : activeNav.replace('-', ' ')}
            </h1>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: '12px' }}>Efficiency, Performance, and Streamlined Operations</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Theme Toggle Button */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                style={{
                  background: theme.cardBg,
                  color: theme.textMain,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isDarkMode ? <Sun size={15} color="#facc15" /> : <Moon size={15} color="#475569" />}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
            )}

            {/* User Details & Admin Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: theme.userInfoBg, padding: '6px 14px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: theme.userIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.userIconColor }}>
                <UserIcon size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMain }}>{displayName}</span>
                  <span style={{ background: theme.adminBadgeBg, color: theme.adminBadgeText, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ShieldCheck size={10} /> ADMIN
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: theme.textMuted }}>{displayEid}</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              style={{ padding: '8px 14px', background: theme.signOutBg, color: theme.signOutText, border: `1px solid ${theme.signOutBorder}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dynamic Panel Content Router */}
        <div style={{ padding: '40px', flex: 1, boxSizing: 'border-box', overflowY: 'auto' }}>
          {activeNav === 'dashboard' && (
            <WorkspaceDashboardDisplay onViewMoreLogs={() => setActiveNav('aht-monitoring')} isDarkMode={isDarkMode} />
          )}
          {activeNav === 'schedule' && <ScheduleAdmin isDarkMode={isDarkMode} />}
          {activeNav === 'create-user' && <CreateUser isDarkMode={isDarkMode} />}
          {activeNav === 'manage-user' && <ManageUser isDarkMode={isDarkMode} />}
          {activeNav === 'aht-monitoring' && <AHTMonitoringAdmin isDarkMode={isDarkMode} />}
          {activeNav === 'knowledge-guidelines' && <KnowledgeGuidelineAdmin currentUser={currentUser} isDarkMode={isDarkMode} />}
          {activeNav === 'admin-profile' && <AdminProfile isDarkMode={isDarkMode} />}
          
          {activeNav === 'scoreboard' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ background: theme.cardBg, padding: '50px 40px', borderRadius: '16px', border: `1px solid ${theme.border}`, textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
                <div style={{ width: '48px', height: '48px', background: theme.activeNavBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.activeNavText, margin: '0 auto 20px auto' }}>
                  <Info size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain, textTransform: 'capitalize' }}>
                  Scoreboard Module
                </h3>
                <p style={{ margin: 0, color: theme.textMuted, fontSize: '14px', lineHeight: '1.5' }}>
                  Data will display in here soon. Content for this section is currently under development.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}