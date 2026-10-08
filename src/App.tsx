import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider, useNotification } from './context/NotificationContext.tsx';
import { TopNavbar } from './components/TopNavbar.tsx';
import { Sidebar, TabId } from './components/Sidebar.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DocumentsPage } from './pages/DocumentsPage.tsx';
import { FolderViewPage } from './pages/FolderViewPage.tsx';
import { AuditLogsPage } from './pages/AuditLogsPage.tsx';
import { UserManagementPage } from './pages/UserManagementPage.tsx';
import { RoleManagementPage } from './pages/RoleManagementPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { DocumentViewModal } from './components/DocumentViewModal.tsx';
import { ScenarioWalkthrough } from './components/ScenarioWalkthrough.tsx';
import { DocumentRecord, Folder, DashboardStats } from './types/index.ts';

function MainApp() {
  const { user, token, activeRole, isLoading, apiFetch, login } = useAuth();
  const { showToast } = useNotification();

  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  // App Data
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [folders, setFolders] = useState<(Folder & { isApplicable?: boolean; statusReason?: string })[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    myDocuments: 0,
    sharedWithMe: 0,
    activityCountToday: 0
  });
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Load repository data
  const loadRepositoryData = useCallback(async () => {
    if (!token) return;
    setIsDataLoading(true);

    try {
      const [docsRes, foldersRes, statsRes] = await Promise.all([
        apiFetch('/api/documents'),
        apiFetch('/api/folders'),
        apiFetch('/api/stats/dashboard')
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData.folders || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {
          totalDocuments: 0,
          myDocuments: 0,
          sharedWithMe: 0,
          activityCountToday: 0
        });
      }
    } catch (err) {
      console.error('Failed to load repository data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [token, apiFetch]);

  // Reload when active role or token changes
  useEffect(() => {
    if (user && token) {
      loadRepositoryData();
    }
  }, [user, token, activeRole?.id, loadRepositoryData]);

  // Download handler
  const handleDownloadDoc = async (doc: DocumentRecord) => {
    try {
      const res = await apiFetch(`/api/documents/${doc.id}/download`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showToast('error', 'Download Denied', errorData.error || 'Access forbidden');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('success', 'Download Complete', `Saved ${doc.fileName}`);
    } catch (err: any) {
      showToast('error', 'Download Error', err.message);
    }
  };

  // Delete handler
  const handleDeleteDoc = async (doc: DocumentRecord) => {
    if (doc.ownerId !== user?.id) {
      showToast('error', 'Forbidden', 'Only the document owner can delete this file.');
      return;
    }

    try {
      const res = await apiFetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }

      showToast('success', 'Deleted', `Document "${doc.title}" removed.`);
      loadRepositoryData();
      if (viewingDoc?.id === doc.id) {
        setViewingDoc(null);
      }
    } catch (err: any) {
      showToast('error', 'Deletion Failed', err.message);
    }
  };

  // Scenario user switcher handler
  const handleScenarioSelectUser = async (demoEmail: string) => {
    const res = await login(demoEmail, 'password123');
    if (res.success) {
      showToast('success', 'Scenario Role Switched', `Now logged in as ${demoEmail}`);
      setCurrentTab('dashboard');
    } else {
      showToast('error', 'Login Failed', res.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F4EC] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#020202] text-[#96DDB1] font-bold text-base flex items-center justify-center animate-pulse">
          UV
        </div>
        <p className="text-xs font-mono font-semibold text-[#746C67]">
          Initializing UniVault Security Subsystem...
        </p>
      </div>
    );
  }

  // Unauthenticated -> LoginPage
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F6F4EC] text-[#020202] flex flex-col">
      {/* Top Navbar */}
      <TopNavbar
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenScenarioModal={() => setIsScenarioOpen(true)}
        searchQuery={globalSearchQuery}
        setSearchQuery={q => {
          setGlobalSearchQuery(q);
          if (q.trim() && currentTab === 'dashboard') {
            setCurrentTab('documents-all');
          }
        }}
      />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              folders={folders}
              recentDocuments={documents}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenFolder={f => {
                if (f.isApplicable !== false) {
                  setCurrentTab('folders');
                } else {
                  showToast('info', 'Folder Restricted', f.statusReason || 'Not applicable to your active role clearance.');
                }
              }}
              onViewDoc={doc => setViewingDoc(doc)}
              onDownloadDoc={handleDownloadDoc}
              onDeleteDoc={handleDeleteDoc}
              onViewAllDocs={() => setCurrentTab('documents-all')}
              onOpenScenarioModal={() => setIsScenarioOpen(true)}
            />
          )}

          {currentTab === 'documents-all' && (
            <DocumentsPage
              documents={documents}
              folders={folders}
              currentUserId={user.id}
              activeFilter="all"
              setActiveFilter={f => {
                if (f === 'my') setCurrentTab('documents-my');
                else if (f === 'shared') setCurrentTab('documents-shared');
                else setCurrentTab('documents-all');
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
              onViewDoc={doc => setViewingDoc(doc)}
              onDownloadDoc={handleDownloadDoc}
              onDeleteDoc={handleDeleteDoc}
              onRefresh={loadRepositoryData}
            />
          )}

          {currentTab === 'documents-my' && (
            <DocumentsPage
              documents={documents}
              folders={folders}
              currentUserId={user.id}
              activeFilter="my"
              setActiveFilter={f => {
                if (f === 'all') setCurrentTab('documents-all');
                else if (f === 'shared') setCurrentTab('documents-shared');
                else setCurrentTab('documents-my');
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
              onViewDoc={doc => setViewingDoc(doc)}
              onDownloadDoc={handleDownloadDoc}
              onDeleteDoc={handleDeleteDoc}
              onRefresh={loadRepositoryData}
            />
          )}

          {currentTab === 'documents-shared' && (
            <DocumentsPage
              documents={documents}
              folders={folders}
              currentUserId={user.id}
              activeFilter="shared"
              setActiveFilter={f => {
                if (f === 'all') setCurrentTab('documents-all');
                else if (f === 'my') setCurrentTab('documents-my');
                else setCurrentTab('documents-shared');
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
              onViewDoc={doc => setViewingDoc(doc)}
              onDownloadDoc={handleDownloadDoc}
              onDeleteDoc={handleDeleteDoc}
              onRefresh={loadRepositoryData}
            />
          )}

          {(currentTab === 'folders' || currentTab === 'admin-folders') && (
            <FolderViewPage
              folders={folders}
              documents={documents}
              onRefreshFolders={loadRepositoryData}
              onOpenUpload={() => setIsUploadOpen(true)}
              onViewDoc={doc => setViewingDoc(doc)}
              onDownloadDoc={handleDownloadDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {currentTab === 'activity' && <AuditLogsPage />}

          {currentTab === 'admin-users' && <UserManagementPage />}

          {currentTab === 'admin-roles' && <RoleManagementPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folders={folders}
        onUploadSuccess={loadRepositoryData}
      />

      {/* Document View & Permissions Explainer Modal */}
      <DocumentViewModal
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onDownload={handleDownloadDoc}
        onDeleted={loadRepositoryData}
      />

      {/* Scenario Walkthrough Modal */}
      <ScenarioWalkthrough
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
        onSelectUser={handleScenarioSelectUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </NotificationProvider>
  );
}
