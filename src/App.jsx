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
import LoginView from './components/Auth/LoginView';

import { Cloud } from 'lucide-react';
import { dbRepository } from './services/dbRepository';
import { googleDriveService } from './services/googleDriveService';
import { authService } from './services/authService';

const STORAGE_THEME = 'kmn_theme';
const STORAGE_ROLE = 'kmn_user_role';
const STORAGE_SIDEBAR_COLLAPSED = 'kmn_sidebar_collapsed';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [role, setRole] = useState(() => {
    const user = authService.getCurrentUser();
    return user ? user.role : (localStorage.getItem(STORAGE_ROLE) || 'admin');
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbVersion, setDbVersion] = useState(0);

  // Global Navigation & Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDbHubOpen, setIsDbHubOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED);
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  // Direct entity inspect modals (from search / dashboard)
  const [viewingAssetId, setViewingAssetId] = useState(null);
  const [isAssetProfileOpen, setIsAssetProfileOpen] = useState(false);

  const [viewingUserId, setViewingUserId] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const [viewingPrinterId, setViewingPrinterId] = useState(null);
  const [isPrinterProfileOpen, setIsPrinterProfileOpen] = useState(false);

  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  // 1. Listen to Authentication State changes
  useEffect(() => {
    const unsubscribeAuth = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        setRole(user.role);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Initialize relational database repository only when authenticated
  useEffect(() => {
    if (!currentUser) return;

    if (googleDriveService.isConfigured()) {
      setIsConnectingDrive(true);
    }

    dbRepository.init().finally(() => {
      setIsConnectingDrive(false);
      setDbVersion(v => v + 1);
    });

    const unsubscribe = dbRepository.subscribe(() => {
      setDbVersion(v => v + 1);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Set theme data attribute on body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  // 4. Set role in storage and sync
  useEffect(() => {
    localStorage.setItem(STORAGE_ROLE, role);
  }, [role]);

  // 5. Global hotkeys for Search (Ctrl+K or Cmd+K) and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 6. Responsive listener for sidebar tablet default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobileSidebarOpen(false);
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        if (localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED) === null) {
          setIsSidebarCollapsed(true);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleRole = () => {
    setRole(prev => (prev === 'admin' ? 'viewer' : 'admin'));
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
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

  // =========================================================================
  // SECURITY GATE: Render ONLY Login Screen until valid credentials entered
  // =========================================================================
  if (!currentUser) {
    return (
      <LoginView
        theme={theme}
        onToggleTheme={toggleTheme}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setRole(user.role);
        }}
      />
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`} data-theme={theme}>
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        role={role}
        onToggleRole={toggleRole}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDatabaseHub={() => setIsDbHubOpen(true)}
        onToggleMobileMenu={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsMobileSidebarOpen(prev => !prev);
          } else {
            toggleSidebarCollapse();
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Layout */}
      <div className="app-main-layout">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          currentUser={currentUser}
          onLogout={handleLogout}
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

      {/* Direct Google Drive Connecting Splash Screen */}
      {isConnectingDrive && (
        <div className="db-connecting-overlay">
          <div className="db-connecting-card">
            <div className="db-connecting-icon-pulse">
              <Cloud size={36} className="text-cyan animate-pulse" />
            </div>
            <h3>Connecting to Google Drive...</h3>
            <p>Loading live assets, repairs, users, and relational tables directly from Google Spreadsheet</p>
            <div className="db-connecting-bar">
              <div className="db-connecting-progress"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
