import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserAvatar } from './UserAvatar.tsx';
import { RoleBadge } from './RoleBadge.tsx';
import { 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Search, 
  Menu, 
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  onOpenUpload: () => void;
  onOpenScenarioModal?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onOpenUpload,
  onOpenScenarioModal,
  searchQuery,
  setSearchQuery
}) => {
  const { user, activeRole, switchRole, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-[#F6F4EC]/95 backdrop-blur-md border-b border-[#D9D6CC] px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#020202] flex items-center justify-center text-[#96DDB1] font-bold text-sm shadow-sm">
            UV
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-[#020202]">UniVault</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]/50 font-semibold">
                GSFC University
              </span>
            </div>
            <p className="text-[11px] text-[#746C67] -mt-0.5 font-medium truncate max-w-[200px]">
              {user.departmentName}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#746C67] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, tags, folders, or authors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#E8E6DD]/70 hover:bg-[#E8E6DD] focus:bg-white text-sm text-[#020202] placeholder-[#746C67] pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-[#5FAF82] focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Right: Actions, Role Switcher & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Scenario Helper Trigger */}
        {onOpenScenarioModal && (
          <button
            onClick={onOpenScenarioModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E8E6DD] hover:bg-[#D9D6CC] text-[#020202] border border-[#D9D6CC] transition-all"
            title="Demonstrate 3-user access control test"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5FAF82]" />
            <span>Test Scenario</span>
          </button>
        )}

        {/* Upload Document Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#020202] hover:bg-[#202020] text-white shadow-sm transition-all"
        >
          <span className="text-[#96DDB1] font-bold text-sm leading-none">+</span>
          <span>Upload</span>
        </button>

        {/* Role Switcher (Crucial for Multi-Role Support) */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleDropdownOpen(!roleDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium ${
              user.roles.length > 1
                ? 'bg-white hover:bg-[#E8E6DD]/40 border-[#D9D6CC] cursor-pointer'
                : 'bg-white/60 border-[#D9D6CC] cursor-default'
            }`}
          >
            <span className="text-[#746C67] hidden lg:inline">Viewing as:</span>
            <RoleBadge roleName={activeRole?.name || 'Staff'} level={activeRole?.level} showLevel />
            {user.roles.length > 1 && (
              <ChevronDown className="w-3.5 h-3.5 text-[#746C67] -ml-0.5" />
            )}
          </button>

          {/* Role selector dropdown */}
          {roleDropdownOpen && user.roles.length > 1 && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#D9D6CC] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#E8E6DD] mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#020202]">
                  <Layers className="w-3.5 h-3.5 text-[#5FAF82]" />
                  <span>Switch Active Role</span>
                </div>
                <p className="text-[11px] text-[#746C67] mt-0.5">
                  You have {user.roles.length} assigned institutional roles.
                </p>
              </div>

              <div className="space-y-1">
                {user.roles.map(r => {
                  const isActive = r.id === activeRole?.id;
                  return (
                    <button
                      key={r.id}
                      onClick={async () => {
                        await switchRole(r.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-[#96DDB1]/25 font-semibold text-[#020202] border border-[#96DDB1]/60'
                          : 'hover:bg-[#F6F4EC] text-[#020202]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{r.name}</span>
                          <span className="font-mono text-[10px] text-[#746C67]">L{r.level}</span>
                        </div>
                        <p className="text-[10px] text-[#746C67] mt-0.5 line-clamp-1">
                          {r.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-[#5FAF82] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setRoleDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#E8E6DD] transition-colors"
          >
            <UserAvatar name={user.name} size="md" />
            <span className="hidden xl:inline text-xs font-medium text-[#020202] max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown className="w-3 h-3 text-[#746C67] hidden xl:inline" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#D9D6CC] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-2 border-b border-[#E8E6DD] mb-2">
                <p className="text-xs font-bold text-[#020202]">{user.name}</p>
                <p className="text-[11px] text-[#746C67] truncate">{user.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#746C67]">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{user.departmentName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="px-2 py-1.5 text-[11px] text-[#746C67] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5FAF82]" />
                  <span>Hierarchy Level: {activeRole?.level}</span>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
