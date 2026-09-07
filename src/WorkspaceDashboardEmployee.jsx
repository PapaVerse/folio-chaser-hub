import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Award, 
  BookOpen,
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Info, 
  User as UserIcon,
  UserCheck,
  Menu,
  X,
  Layers,
  Calendar as CalendarIcon
} from 'lucide-react';
import AHTMonitoringEmployee from './WorskspaceEmployeeSections/AHTMonitoringEmployee';
import KnowledgeGuidelineEmployee from './WorskspaceEmployeeSections/KnowledgeGuidelineEmployee';
import EmployeeProfile from "./WorskspaceEmployeeSections/EmployeeProfile";
import ScheduleEmployee from "./WorskspaceEmployeeSections/ScheduleEmployee";

export default function WorkspaceDashboardEmployee({ currentUser, onLogout, isDarkMode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resizing for responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (mobileView) {
        setIsSidebarOpen(false);
      } else {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayName = currentUser?.employee_name || 'Employee';
  const displayEid = currentUser?.eid || 'EMP001';

  const handleNavClick = (navKey) => {
    setActiveNav(navKey);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Dynamic Theme Colors based on isDarkMode prop
  const theme = {
    appBg: isDarkMode ? '#0f172a' : '#f8fafc',
    sidebarBg: isDarkMode ? '#1e293b' : '#ffffff',
    sidebarBorder: isDarkMode ? '#334155' : '#e2e8f0',
    sidebarHeaderBorder: isDarkMode ? '#334155' : '#f1f5f9',
    logoText: isDarkMode ? '#f8fafc' : '#0f172a',
    logoSub: isDarkMode ? '#94a3b8' : '#64748b',
    collapseBtnBg: isDarkMode ? '#334155' : '#f1f5f9',
    collapseBtnColor: isDarkMode ? '#cbd5e1' : '#475569',
    navActiveBg: isDarkMode ? '#1e3a8a' : '#eff6ff',
    navActiveColor: isDarkMode ? '#93c5fd' : '#2563eb',
    navInactiveColor: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? '#1e293b' : '#ffffff',
    headerBorder: isDarkMode ? '#334155' : '#e2e8f0',
    titleMain: isDarkMode ? '#f8fafc' : '#0f172a',
    titleSub: isDarkMode ? '#94a3b8' : '#64748b',
    userInfoBg: isDarkMode ? '#0f172a' : '#f8fafc',
    userInfoBorder: isDarkMode ? '#334155' : '#e2e8f0',
    userIconBg: isDarkMode ? '#1e3a8a' : '#e0f2fe',
    userIconColor: isDarkMode ? '#93c5fd' : '#0284c7',
    badgeBg: isDarkMode ? '#064e3b' : '#f0fdf4',
    badgeColor: isDarkMode ? '#86efac' : '#16a34a',
    logoutBg: isDarkMode ? '#7f1d1d' : '#fef2f2',
    logoutBorder: isDarkMode ? '#991b1b' : '#fecaca',
    logoutColor: isDarkMode ? '#fca5a5' : '#dc2626',
    placeholderCardBg: isDarkMode ? '#1e293b' : '#ffffff',
    placeholderCardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    placeholderIconBg: isDarkMode ? '#1e3a8a' : '#eff6ff',
    placeholderIconColor: isDarkMode ? '#93c5fd' : '#2563eb',
    mobileMenuBtnBg: isDarkMode ? '#334155' : '#f1f5f9',
    mobileMenuBtnColor: isDarkMode ? '#cbd5e1' : '#475569',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.appBg, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Mobile Backdrop Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 40,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar Panel */}
      <div style={{ 
        width: isMobile ? '260px' : (isSidebarOpen ? '260px' : '80px'), 
        background: theme.sidebarBg, 
        borderRight: `1px solid ${theme.sidebarBorder}`, 
        display: 'flex', 
        flexDirection: 'column', 
        transition: isMobile ? 'transform 0.3s ease' : 'width 0.3s ease',
        boxSizing: 'border-box',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        bottom: 0,
        left: 0,
        transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        zIndex: 50
      }}>
        
        <div style={{ 
          padding: '24px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'space-between', 
          flexDirection: (!isMobile && !isSidebarOpen) ? 'column' : 'row',
          gap: (!isMobile && !isSidebarOpen) ? '16px' : '0',
          borderBottom: `1px solid ${theme.sidebarHeaderBorder}` 
        }}>
          {(!isMobile && !isSidebarOpen) ? (
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.logoText, textAlign: 'center' }}>FC</h2>
          ) : (
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.logoText, letterSpacing: '-0.025em' }}>FC HUB</h2>
              <span style={{ fontSize: '11px', color: theme.logoSub, fontWeight: '500' }}>Workspace</span>
            </div>
          )}
          
          <button 
            onClick={() => {
              if (isMobile) {
                setIsMobileMenuOpen(false);
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
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
              color: theme.collapseBtnColor,
              flexShrink: 0
            }}
            title={isMobile ? "Close Menu" : (isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar")}
          >
            {isMobile ? <X size={18} /> : (isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />)}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          
          {/* Dashboard */}
          <button 
            onClick={() => handleNavClick('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'dashboard' ? theme.navActiveBg : 'transparent', color: activeNav === 'dashboard' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Dashboard" : ""}
          >
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Dashboard</span>}
          </button>

          {/* Schedule */}
          <button 
            onClick={() => handleNavClick('schedule')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'schedule' ? theme.navActiveBg : 'transparent', color: activeNav === 'schedule' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Schedule" : ""}
          >
            <CalendarIcon size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Schedule</span>}
          </button>

          {/* AHT Monitoring */}
          <button 
            onClick={() => handleNavClick('aht-monitoring')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'aht-monitoring' ? theme.navActiveBg : 'transparent', color: activeNav === 'aht-monitoring' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "AHT Monitoring" : ""}
          >
            <Clock size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>AHT Monitoring</span>}
          </button>

          {/* Scoreboard */}
          <button 
            onClick={() => handleNavClick('scoreboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'scoreboard' ? theme.navActiveBg : 'transparent', color: activeNav === 'scoreboard' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Scoreboard" : ""}
          >
            <Award size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Scoreboard</span>}
          </button>

          {/* Guidelines / Knowledge Base */}
          <button 
            onClick={() => handleNavClick('guidelines')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'guidelines' ? theme.navActiveBg : 'transparent', color: activeNav === 'guidelines' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Guidelines" : ""}
          >
            <BookOpen size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Guidelines</span>}
          </button>

          {/* Team's Profile */}
          <button 
            onClick={() => handleNavClick('teamProfile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'teamProfile' ? theme.navActiveBg : 'transparent', color: activeNav === 'teamProfile' ? theme.navActiveColor : theme.navInactiveColor, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Team's Profile" : ""}
          >
            <Layers size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Team's Profile</span>}
          </button>

        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        
        {/* Top Header */}
        <div style={{ background: theme.headerBg, padding: isMobile ? '12px 16px' : '20px 32px', borderBottom: `1px solid ${theme.headerBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background: theme.mobileMenuBtnBg, border: 'none', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.mobileMenuBtnColor, flexShrink: '0' }}
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: isMobile ? '16px' : '20px', fontWeight: '800', color: theme.titleMain, textTransform: 'capitalize' }}>
                {activeNav === 'aht-monitoring' ? 'AHT Monitoring' : (activeNav === 'guidelines' ? 'Knowledge Base & Guidelines' : (activeNav === 'teamProfile' ? "Team's Profile" : (activeNav === 'schedule' ? 'Schedule' : activeNav)))}
              </h1>
              {!isMobile && <p style={{ margin: 0, color: theme.titleSub, fontSize: '12px' }}>Efficiency, Performance, and Streamlined Operations</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px', marginLeft: isMobile ? 'auto' : '0' }}>
            
            {/* User Details & Employee Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: theme.userInfoBg, padding: '6px 10px', borderRadius: '8px', border: `1px solid ${theme.userInfoBorder}` }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: theme.userIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.userIconColor, flexShrink: 0 }}>
                <UserIcon size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: theme.titleMain, maxWidth: isMobile ? '100px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                  {!isMobile && (
                    <span style={{ background: theme.badgeBg, color: theme.badgeColor, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <UserCheck size={10} /> EMPLOYEE
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: theme.titleSub }}>{displayEid}</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              style={{ padding: isMobile ? '8px' : '8px 14px', background: theme.logoutBg, color: theme.logoutColor, border: `1px solid ${theme.logoutBorder}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              title="Sign Out"
            >
              <LogOut size={15} />
              {!isMobile && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Dynamic Panel Content Router */}
        <div style={{ padding: isMobile ? '16px' : '40px', flex: 1, boxSizing: 'border-box', overflowX: 'hidden' }}>
          {activeNav === 'schedule' && <ScheduleEmployee currentUser={currentUser} isDarkMode={isDarkMode} />}
          {activeNav === 'aht-monitoring' && <AHTMonitoringEmployee currentUser={currentUser} isDarkMode={isDarkMode} />}
          {activeNav === 'guidelines' && <KnowledgeGuidelineEmployee currentUser={currentUser} isDarkMode={isDarkMode} />}
          {activeNav === 'teamProfile' && <EmployeeProfile isDarkMode={isDarkMode} />}
          
          {(activeNav === 'dashboard' || activeNav === 'scoreboard') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ background: theme.placeholderCardBg, padding: '50px 20px', borderRadius: '16px', border: `1px solid ${theme.placeholderCardBorder}`, textAlign: 'center', maxWidth: '500px', width: '100%', boxSizing: 'border-box', boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ width: '48px', height: '48px', background: theme.placeholderIconBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.placeholderIconColor, margin: '0 auto 20px auto' }}>
                  <Info size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: theme.titleMain, textTransform: 'capitalize' }}>
                  {activeNav} Module
                </h3>
                <p style={{ margin: 0, color: theme.titleSub, fontSize: '14px', lineHeight: '1.5' }}>
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