import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import WorkstationsView from './components/WorkstationsView';
import StatsCards from './components/StatsCards';
import ExcelGrid from './components/ExcelGrid';
import MachineModal from './components/MachineModal';
import MachineDetailDrawer from './components/MachineDetailDrawer';
import ServiceLogsModal from './components/ServiceLogsModal';
import SupabaseSettingsModal from './components/SupabaseSettingsModal';
import ExcelImportModal from './components/ExcelImportModal';
import AdminPinModal from './components/AdminPinModal';
import { Database } from 'lucide-react';

import { initialMachines, initialServices } from './data/seedData';
import { 
  getSupabaseCredentials, 
  fetchMachinesCloud, 
  fetchServicesCloud, 
  upsertMachineCloud, 
  deleteMachineCloud, 
  upsertServiceCloud, 
  deleteServiceCloud 
} from './lib/supabaseClient';

import { 
  HardDrive, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Info 
} from 'lucide-react';

const STORAGE_MACHINES = 'kmn_machines_data';
const STORAGE_SERVICES = 'kmn_services_data';
const STORAGE_THEME = 'kmn_theme';
const STORAGE_ROLE = 'kmn_user_role';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_THEME) || 'dark';
  });

  // Role: 'viewer' or 'admin'
  const [role, setRole] = useState(() => {
    return localStorage.getItem(STORAGE_ROLE) || 'viewer';
  });

  // Active Main Tab: 'dashboard', 'workstations', 'machines', or 'services'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filters
  const [officeFilter, setOfficeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Data state
  const [machines, setMachines] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_MACHINES);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse cached machines:', e);
    }
    return initialMachines;
  });

  const [services, setServices] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_SERVICES);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse cached services:', e);
    }
    return initialServices;
  });

  // Cloud status
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Modals state
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [viewingMachine, setViewingMachine] = useState(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [servicePrefillMachine, setServicePrefillMachine] = useState(null);

  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Sync theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  // Sync role to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_ROLE, role);
  }, [role]);

  // Sync machines to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_MACHINES, JSON.stringify(machines));
  }, [machines]);

  // Sync services to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_SERVICES, JSON.stringify(services));
  }, [services]);

  // Check Supabase Cloud connection on mount
  const checkCloudData = useCallback(async () => {
    const { url, key } = getSupabaseCredentials();
    if (!url || !key) {
      setIsCloudConnected(false);
      return;
    }

    try {
      const cloudMachines = await fetchMachinesCloud();
      if (cloudMachines && cloudMachines.length > 0) {
        setMachines(cloudMachines);
      }
      const cloudServices = await fetchServicesCloud();
      if (cloudServices && cloudServices.length > 0) {
        setServices(cloudServices);
      }
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local data:', err.message);
      setIsCloudConnected(false);
    }
  }, []);

  useEffect(() => {
    checkCloudData();
  }, [checkCloudData]);

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Switch role directly or prompt
  const handleSwitchRole = (newRole) => {
    if (newRole === 'admin' && role !== 'admin') {
      setIsAdminPinOpen(true);
    } else {
      setRole(newRole);
      showToast(`Switched to ${newRole === 'viewer' ? 'Viewer Mode (Read-only)' : 'Admin Mode'}`, 'info');
    }
  };

  // Machine Actions: Save (Add or Update)
  const handleSaveMachine = async (machineData) => {
    let updated;
    const isEdit = Boolean(machineData.id);

    if (isEdit) {
      updated = machines.map(m => m.id === machineData.id ? machineData : m);
    } else {
      const newMachine = {
        id: `m-${Date.now()}`,
        ...machineData,
        created_at: new Date().toISOString()
      };
      updated = [newMachine, ...machines];
    }
    setMachines(updated);
    showToast(isEdit ? 'Machine updated successfully' : 'New computer added to inventory', 'success');

    // Attempt cloud upsert if connected
    if (isCloudConnected) {
      try {
        await upsertMachineCloud(machineData);
      } catch (err) {
        console.error('Failed to sync machine to Supabase:', err);
        showToast('Saved locally, but Supabase sync failed: ' + err.message, 'error');
      }
    }
  };

  // Machine Actions: Delete
  const handleDeleteMachine = async (id) => {
    setMachines(prev => prev.filter(m => m.id !== id));
    showToast('Machine record removed', 'info');

    if (isCloudConnected) {
      try {
        await deleteMachineCloud(id);
      } catch (err) {
        console.error('Failed to delete machine from Supabase:', err);
      }
    }
  };

  // Machine Actions: Open Add
  const handleOpenAddMachine = () => {
    setEditingMachine(null);
    setIsMachineModalOpen(true);
  };

  // Machine Actions: Open Edit
  const handleOpenEditMachine = (machine) => {
    setEditingMachine(machine);
    setIsMachineModalOpen(true);
  };

  // Machine Actions: View Details
  const handleViewMachine = (machine) => {
    setViewingMachine(machine);
    setIsDetailDrawerOpen(true);
  };

  // Add Service record for a specific machine
  const handleAddServiceForMachine = (machine) => {
    setServicePrefillMachine(machine);
    setIsServiceModalOpen(true);
  };

  // Service Records: Save
  const handleSaveService = async (serviceData) => {
    const isEdit = services.some(s => s.id === serviceData.id);
    let updated;
    if (isEdit) {
      updated = services.map(s => s.id === serviceData.id ? serviceData : s);
    } else {
      updated = [serviceData, ...services];
    }
    setServices(updated);

    if (isCloudConnected) {
      try {
        await upsertServiceCloud(serviceData);
      } catch (err) {
        console.error('Failed to sync service to Supabase:', err);
      }
    }
  };

  // Service Records: Delete
  const handleDeleteService = async (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    showToast('Service record deleted', 'info');

    if (isCloudConnected) {
      try {
        await deleteServiceCloud(id);
      } catch (err) {
        console.error('Failed to delete service from Supabase:', err);
      }
    }
  };

  // Import Excel records
  const handleImportSuccess = (importedList, mode) => {
    if (mode === 'replace') {
      setMachines(importedList);
    } else {
      setMachines(prev => [...importedList, ...prev]);
    }
  };

  return (
    <div className="app-shell">
      {/* Modern HireWise Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'services') {
            setServicePrefillMachine(null);
            setIsServiceModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        role={role}
        onSwitchRole={handleSwitchRole}
        theme={theme}
        onToggleTheme={toggleTheme}
        isCloudConnected={isCloudConnected}
        onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
        onOpenAdminPin={() => setIsAdminPinOpen(true)}
        machinesCount={machines.length}
        servicesCount={services.length}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header-bar">
          <div>
            <h1 className="header-greeting-title">IT Asset Operations Hub</h1>
            <span className="header-date-badge">Saturday, September 19, 2026 &bull; KMN Aqua Services (Pvt) Ltd</span>
          </div>

          <div className="header-actions-right">
            {/* Supabase Status Pill */}
            <button 
              type="button" 
              className="cloud-status-pill"
              onClick={() => setIsCloudSettingsOpen(true)}
              title="Configure Supabase Database"
            >
              <span className={`status-dot ${isCloudConnected ? 'connected' : 'disconnected'}`}></span>
              <Database size={14} />
              <span>{isCloudConnected ? 'Cloud Synced' : 'Local Mode'}</span>
            </button>

            {/* Quick Service / Bill Log button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setServicePrefillMachine(null);
                setIsServiceModalOpen(true);
              }}
              title="Log new maintenance bill / update"
            >
              <Wrench size={14} />
              <span>Service Bill</span>
            </button>

            {role === 'admin' ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddMachine}
                title="Add new computer / equipment"
              >
                <span>+ Add Asset</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAdminPinOpen(true)}
                title="Unlock Admin Privileges"
              >
                <span>Unlock Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* View Switching */}
        {activeTab === 'dashboard' && (
          <DashboardHome
            machines={machines}
            services={services}
            onSelectTab={(tab) => {
              if (tab === 'services') {
                setServicePrefillMachine(null);
                setIsServiceModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenServiceModal={(serviceOrData) => {
              setServicePrefillMachine(serviceOrData);
              setIsServiceModalOpen(true);
            }}
            onViewMachine={handleViewMachine}
            role={role}
          />
        )}

        {activeTab === 'workstations' && (
          <WorkstationsView
            machines={machines}
            services={services}
            onOpenServiceModal={(prefill) => {
              setServicePrefillMachine(prefill);
              setIsServiceModalOpen(true);
            }}
            onViewMachine={handleViewMachine}
            onAddMachine={handleOpenAddMachine}
            role={role}
          />
        )}

        {activeTab === 'machines' && (
          <div style={{ padding: '0 2.25rem 3rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <StatsCards
                machines={machines}
                services={services}
                onFilterByStatus={(status) => setStatusFilter(status)}
                onFilterByOffice={(office) => setOfficeFilter(office)}
              />
            </div>
            <ExcelGrid
              machines={machines}
              role={role}
              onAddMachine={handleOpenAddMachine}
              onEditMachine={handleOpenEditMachine}
              onDeleteMachine={handleDeleteMachine}
              onViewMachine={handleViewMachine}
              onAddServiceForMachine={handleAddServiceForMachine}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              officeFilter={officeFilter}
              setOfficeFilter={setOfficeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              showToast={showToast}
            />
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <MachineModal
        isOpen={isMachineModalOpen}
        onClose={() => setIsMachineModalOpen(false)}
        onSave={handleSaveMachine}
        initialData={editingMachine}
        existingMachines={machines}
      />

      <MachineDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        machine={viewingMachine}
        services={services}
        role={role}
        onEditMachine={handleOpenEditMachine}
        onAddService={handleAddServiceForMachine}
      />

      <ServiceLogsModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServicePrefillMachine(null);
        }}
        services={services}
        machines={machines}
        role={role}
        onSaveService={handleSaveService}
        onDeleteService={handleDeleteService}
        prefillMachine={servicePrefillMachine}
        showToast={showToast}
      />

      <SupabaseSettingsModal
        isOpen={isCloudSettingsOpen}
        onClose={() => setIsCloudSettingsOpen(false)}
        machines={machines}
        services={services}
        onSyncComplete={checkCloudData}
        showToast={showToast}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        showToast={showToast}
      />

      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onUnlockSuccess={() => setRole('admin')}
        showToast={showToast}
      />

      {/* Toast Notifications container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
            {toast.type === 'error' && <AlertCircle size={16} color="var(--accent-rose)" />}
            {toast.type === 'info' && <Info size={16} color="var(--brand-primary)" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
