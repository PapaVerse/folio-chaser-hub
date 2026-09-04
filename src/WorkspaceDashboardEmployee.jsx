import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Award, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Info, 
  User as UserIcon,
  UserCheck,
  Menu,
  X 
} from 'lucide-react';
import AHTMonitoringEmployee from './WorskspaceEmployeeSections/AHTMonitoringEmployee';

export default function WorkspaceDashboardEmployee({ currentUser, onLogout }) {
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

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
      
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
        background: '#ffffff', 
        borderRight: '1px solid #e2e8f0', 
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
          borderBottom: '1px solid #f1f5f9' 
        }}>
          {(!isMobile && !isSidebarOpen) ? (
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>FC</h2>
          ) : (
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>FC HUB</h2>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Workspace</span>
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
              background: '#f1f5f9', 
              border: 'none', 
              borderRadius: '6px', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: '#475569',
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
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'dashboard' ? '#eff6ff' : 'transparent', color: activeNav === 'dashboard' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Dashboard" : ""}
          >
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Dashboard</span>}
          </button>

          {/* AHT Monitoring */}
          <button 
            onClick={() => handleNavClick('aht-monitoring')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'aht-monitoring' ? '#eff6ff' : 'transparent', color: activeNav === 'aht-monitoring' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "AHT Monitoring" : ""}
          >
            <Clock size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>AHT Monitoring</span>}
          </button>

          {/* Scoreboard */}
          <button 
            onClick={() => handleNavClick('scoreboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'scoreboard' ? '#eff6ff' : 'transparent', color: activeNav === 'scoreboard' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: (!isMobile && !isSidebarOpen) ? 'center' : 'flex-start' }}
            title={(!isMobile && !isSidebarOpen) ? "Scoreboard" : ""}
          >
            <Award size={18} style={{ flexShrink: 0 }} />
            {(isMobile || isSidebarOpen) && <span>Scoreboard</span>}
          </button>

        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
        
        {/* Top Header */}
        <div style={{ background: '#ffffff', padding: isMobile ? '12px 16px' : '20px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: '0' }}
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: isMobile ? '16px' : '20px', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>
                {activeNav === 'aht-monitoring' ? 'AHT Monitoring' : activeNav}
              </h1>
              {!isMobile && <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Efficiency, Performance, and Streamlined Operations</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px', marginLeft: isMobile ? 'auto' : '0' }}>
            
            {/* User Details & Employee Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                <UserIcon size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', maxWidth: isMobile ? '100px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                  {!isMobile && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <UserCheck size={10} /> EMPLOYEE
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{displayEid}</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              style={{ padding: isMobile ? '8px' : '8px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              title="Sign Out"
            >
              <LogOut size={15} />
              {!isMobile && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Dynamic Panel Content Router */}
        <div style={{ padding: isMobile ? '16px' : '40px', flex: 1, boxSizing: 'border-box', overflowX: 'hidden' }}>
          {activeNav === 'aht-monitoring' && <AHTMonitoringEmployee currentUser={currentUser} />}
          
          {(activeNav === 'dashboard' || activeNav === 'scoreboard') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ background: '#ffffff', padding: '50px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '500px', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', margin: '0 auto 20px auto' }}>
                  <Info size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' }}>
                  {activeNav} Module
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
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