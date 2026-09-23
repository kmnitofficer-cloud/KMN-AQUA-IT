import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navigation/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import GlobalSearchModal from './components/Navigation/GlobalSearchModal';

// Views
import DashboardOverview from './components/Dashboard/DashboardOverview';
import UsersView from './components/Users/UsersView';
import AssetsView from './components/Assets/AssetsView';
import AssignmentsView from './components/Assignments/AssignmentsView';
import PrintersView from './components/Printers/PrintersView';
import RepairsView from './components/Repairs/RepairsView';
import PartsView from './components/Repairs/PartsView';
import CCTVView from './components/CCTV/CCTVView';
import ACView from './components/AC/ACView';
import ExpensesView from './components/Expenses/ExpensesView';
import InvoicesView from './components/Invoices/InvoicesView';
import ReportsView from './components/Reports/ReportsView';
import LocationsDepartmentsView from './components/Locations/LocationsDepartmentsView';
import DatabaseSyncModal from './components/Database/DatabaseSyncModal';

// Modals for direct entity navigation
import AssetProfileModal from './components/Assets/AssetProfileModal';
import UserProfileModal from './components/Users/UserProfileModal';
import PrinterProfileModal from './components/Printers/PrinterProfileModal';

import { dbRepository } from './services/dbRepository';

const STORAGE_THEME = 'kmn_theme';
const STORAGE_ROLE = 'kmn_user_role';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_THEME) || 'dark');
  const [role, setRole] = useState(() => localStorage.getItem(STORAGE_ROLE) || 'admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbVersion, setDbVersion] = useState(0);

  // Global Navigation & Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDbHubOpen, setIsDbHubOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Direct entity inspect modals (from search / dashboard)
  const [viewingAssetId, setViewingAssetId] = useState(null);
  const [isAssetProfileOpen, setIsAssetProfileOpen] = useState(false);

  const [viewingUserId, setViewingUserId] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const [viewingPrinterId, setViewingPrinterId] = useState(null);
  const [isPrinterProfileOpen, setIsPrinterProfileOpen] = useState(false);

  // 1. Initialize relational database repository and subscribe to updates
  useEffect(() => {
    dbRepository.init().then(() => {
      setDbVersion(v => v + 1);
    });

    const unsubscribe = dbRepository.subscribe(() => {
      setDbVersion(v => v + 1);
    });

    return () => unsubscribe();
  }, []);

  // 2. Set theme data attribute on body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  // 3. Set role
  useEffect(() => {
    localStorage.setItem(STORAGE_ROLE, role);
  }, [role]);

  // 4. Global hotkey for Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleRole = () => {
    setRole(prev => (prev === 'admin' ? 'viewer' : 'admin'));
  };

  // Entity selection handler from Global Search
  const handleSelectEntity = (type, id) => {
    if (type === 'asset') {
      setViewingAssetId(id);
      setIsAssetProfileOpen(true);
    } else if (type === 'user') {
      setViewingUserId(id);
      setIsUserProfileOpen(true);
    } else if (type === 'printer') {
      setViewingPrinterId(id);
      setIsPrinterProfileOpen(true);
    } else if (type === 'repair') {
      setActiveTab('repairs');
    } else if (type === 'invoice') {
      setActiveTab('invoices');
    } else if (type === 'cctv') {
      setActiveTab('cctv');
    } else if (type === 'ac') {
      setActiveTab('ac');
    }
  };

  return (
    <div className="app-container" data-theme={theme}>
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        role={role}
        onToggleRole={toggleRole}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDatabaseHub={() => setIsDbHubOpen(true)}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Main Workspace Layout */}
      <div className="app-main-layout">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="app-content-area" key={dbVersion}>
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigate={setActiveTab}
              onOpenPrinter={(id) => { setViewingPrinterId(id); setIsPrinterProfileOpen(true); }}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              onSelectAsset={(id) => { setViewingAssetId(id); setIsAssetProfileOpen(true); }}
            />
          )}

          {activeTab === 'assets' && (
            <AssetsView
              onSelectUser={(id) => { setViewingUserId(id); setIsUserProfileOpen(true); }}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsView />
          )}

          {activeTab === 'printers' && (
            <PrintersView />
          )}

          {activeTab === 'repairs' && (
            <RepairsView
              onOpenAsset={(id) => { setViewingAssetId(id); setIsAssetProfileOpen(true); }}
            />
          )}

          {activeTab === 'parts' && (
            <PartsView />
          )}

          {activeTab === 'ac' && (
            <ACView />
          )}

          {activeTab === 'cctv' && (
            <CCTVView />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {activeTab === 'locations' && (
            <LocationsDepartmentsView />
          )}

          {activeTab === 'database' && (
            <div className="p-6">
              <button className="btn btn-primary" onClick={() => setIsDbHubOpen(true)}>
                Open Excel Database Hub
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEntity={handleSelectEntity}
      />

      {/* Database & Sync Hub Modal */}
      <DatabaseSyncModal
        isOpen={isDbHubOpen}
        onClose={() => setIsDbHubOpen(false)}
      />

      {/* Global Entity Inspection Modals */}
      <AssetProfileModal
        assetId={viewingAssetId}
        isOpen={isAssetProfileOpen}
        onClose={() => setIsAssetProfileOpen(false)}
        onReassign={() => { setIsAssetProfileOpen(false); setActiveTab('assignments'); }}
        onLogRepair={() => { setIsAssetProfileOpen(false); setActiveTab('repairs'); }}
      />

      <UserProfileModal
        userId={viewingUserId}
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        onSelectAsset={(id) => {
          setIsUserProfileOpen(false);
          setViewingAssetId(id);
          setIsAssetProfileOpen(true);
        }}
      />

      <PrinterProfileModal
        printerId={viewingPrinterId}
        isOpen={isPrinterProfileOpen}
        onClose={() => setIsPrinterProfileOpen(false)}
      />
    </div>
  );
}
