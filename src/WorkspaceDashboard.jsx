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
  ShieldCheck 
} from 'lucide-react';
import CreateUser from './WorskspaceAdminSections/CreateUser';
import ManageUser from './WorskspaceAdminSections/ManageUser';
import AHTMonitoringAdmin from './WorskspaceAdminSections/AHTMonitoringAdmin';

export default function WorkspaceDashboard({ currentUser, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');

  const displayName = currentUser?.employee_name || 'Administrator';
  const displayEid = currentUser?.eid || 'ADMIN';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Sidebar Panel */}
      <div style={{ 
        width: isSidebarOpen ? '260px' : '80px', 
        background: '#ffffff', 
        borderRight: '1px solid #e2e8f0', 
        display: 'flex', 
        flexDirection: 'column', 
        transition: 'width 0.3s ease',
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
          borderBottom: '1px solid #f1f5f9' 
        }}>
          {isSidebarOpen ? (
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>FC HUB</h2>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Control Center</span>
            </div>
          ) : (
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>FC</h2>
          )}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          
          {/* Dashboard */}
          <button 
            onClick={() => setActiveNav('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'dashboard' ? '#eff6ff' : 'transparent', color: activeNav === 'dashboard' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            title={!isSidebarOpen ? "Dashboard" : ""}
          >
            <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          {/* AHT Monitoring */}
          <button 
            onClick={() => setActiveNav('aht-monitoring')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'aht-monitoring' ? '#eff6ff' : 'transparent', color: activeNav === 'aht-monitoring' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            title={!isSidebarOpen ? "AHT Monitoring" : ""}
          >
            <Clock size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>AHT Monitoring</span>}
          </button>

          {/* Scoreboard */}
          <button 
            onClick={() => setActiveNav('scoreboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'scoreboard' ? '#eff6ff' : 'transparent', color: activeNav === 'scoreboard' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            title={!isSidebarOpen ? "Scoreboard" : ""}
          >
            <Award size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Scoreboard</span>}
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 4px' }} />

          {/* Create User */}
          <button 
            onClick={() => setActiveNav('create-user')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'create-user' ? '#eff6ff' : 'transparent', color: activeNav === 'create-user' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            title={!isSidebarOpen ? "Create User" : ""}
          >
            <UserPlus size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Create User</span>}
          </button>

          {/* Manage User */}
          <button 
            onClick={() => setActiveNav('manage-user')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', background: activeNav === 'manage-user' ? '#eff6ff' : 'transparent', color: activeNav === 'manage-user' ? '#2563eb' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            title={!isSidebarOpen ? "Manage User" : ""}
          >
            <Users size={18} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Manage User</span>}
          </button>

        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ background: '#ffffff', padding: '20px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
          <div>
            <h1 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize' }}>
              {activeNav === 'aht-monitoring' ? 'AHT Monitoring' : activeNav.replace('-', ' ')}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Efficiency, Performance, and Streamlined Operations</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* User Details & Admin Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <UserIcon size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{displayName}</span>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ShieldCheck size={10} /> ADMIN
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{displayEid}</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              style={{ padding: '8px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dynamic Panel Content Router */}
        <div style={{ padding: '40px', flex: 1, boxSizing: 'border-box' }}>
          {activeNav === 'create-user' && <CreateUser />}
          {activeNav === 'manage-user' && <ManageUser />}
          {activeNav === 'aht-monitoring' && <AHTMonitoringAdmin />}
          
          {(activeNav === 'dashboard' || activeNav === 'scoreboard') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ background: '#ffffff', padding: '50px 40px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
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