import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  LayoutDashboard, 
  Files, 
  FolderTree, 
  History, 
  Users, 
  ShieldAlert, 
  Sliders, 
  FolderPlus, 
  FileText, 
  Share2,
  X,
  Lock
} from 'lucide-react';

export type TabId = 
  | 'dashboard'
  | 'documents-all'
  | 'documents-my'
  | 'documents-shared'
  | 'folders'
  | 'activity'
  | 'admin-users'
  | 'admin-roles'
  | 'admin-folders'
  | 'settings';

interface SidebarProps {
  currentTab: TabId;
  setCurrentTab: (tab: TabId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user, activeRole } = useAuth();

  if (!user || !activeRole) return null;

  const isLevel1or2 = activeRole.level <= 2;
  const isHoD = activeRole.level === 3;

  const handleNav = (tab: TabId) => {
    setCurrentTab(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: TabId) => {
    const isActive = currentTab === tab;
    return `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-[#020202] text-white shadow-sm'
        : 'text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD]/60'
    }`;
  };

  const content = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#F6F4EC] border-r border-[#D9D6CC] select-none">
      <div className="space-y-6">
        {/* Main Section */}
        <div>
          <p className="px-3 text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67] mb-2">
            Overview
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Repository Section */}
        <div>
          <p className="px-3 text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67] mb-2">
            Repository
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('documents-all')}
              className={navItemClass('documents-all')}
            >
              <Files className="w-4 h-4 shrink-0" />
              <span>All Documents</span>
            </button>
            <button
              onClick={() => handleNav('documents-my')}
              className={navItemClass('documents-my')}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>My Documents</span>
            </button>
            <button
              onClick={() => handleNav('documents-shared')}
              className={navItemClass('documents-shared')}
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Shared With Me</span>
            </button>
            <button
              onClick={() => handleNav('folders')}
              className={navItemClass('folders')}
            >
              <FolderTree className="w-4 h-4 shrink-0" />
              <span>Folders</span>
            </button>
          </div>
        </div>

        {/* Audit & Activity */}
        <div>
          <p className="px-3 text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67] mb-2">
            Governance
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('activity')}
              className={navItemClass('activity')}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Activity & Audit</span>
            </button>
          </div>
        </div>

        {/* Administration Section (Only Level 1 & Level 2 authorized) */}
        {isLevel1or2 ? (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67]">
                Administration
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#96DDB1]/40 text-[#020202] font-semibold">
                L{activeRole.level} Access
              </span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('admin-users')}
                className={navItemClass('admin-users')}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>User Management</span>
              </button>
              <button
                onClick={() => handleNav('admin-roles')}
                className={navItemClass('admin-roles')}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Role Management</span>
              </button>
              <button
                onClick={() => handleNav('admin-folders')}
                className={navItemClass('admin-folders')}
              >
                <FolderPlus className="w-4 h-4 shrink-0" />
                <span>Folder Management</span>
              </button>
            </div>
          </div>
        ) : isHoD ? (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67]">
                Department Admin
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E8E6DD] text-[#020202] font-semibold">
                HoD
              </span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('admin-folders')}
                className={navItemClass('admin-folders')}
              >
                <FolderPlus className="w-4 h-4 shrink-0" />
                <span>Custom Folders</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Preferences */}
        <div>
          <p className="px-3 text-[10px] uppercase font-bold font-mono tracking-wider text-[#746C67] mb-2">
            System
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('settings')}
              className={navItemClass('settings')}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Settings & Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Badge Footer */}
      <div className="pt-4 border-t border-[#D9D6CC]/80 mt-4">
        <div className="p-3 rounded-xl bg-white border border-[#D9D6CC] text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#020202]">Access Control</span>
            <Lock className="w-3 h-3 text-[#5FAF82]" />
          </div>
          <p className="text-[10px] text-[#746C67] leading-relaxed">
            Role: <strong className="text-[#020202]">{activeRole.name}</strong> (Tier {activeRole.level})
          </p>
          <p className="text-[10px] text-[#746C67] leading-relaxed truncate">
            Dept: <strong className="text-[#020202]">{user.departmentCode}</strong>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#F6F4EC] z-10 shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="p-4 flex items-center justify-between border-b border-[#D9D6CC]">
              <span className="font-bold text-sm text-[#020202]">UniVault Navigation</span>
              <button onClick={onCloseMobile} className="p-1 rounded-lg text-[#746C67]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
