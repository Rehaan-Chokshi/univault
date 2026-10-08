import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoleBadge } from '../components/RoleBadge.tsx';
import { UserAvatar } from '../components/UserAvatar.tsx';
import { 
  Sliders, 
  ShieldCheck, 
  Database, 
  Lock, 
  Building, 
  Key, 
  Server,
  Layers,
  Award
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, activeRole } = useAuth();

  if (!user || !activeRole) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#5FAF82]" />
          <span>Profile & Repository Governance</span>
        </h1>
        <p className="text-xs text-[#746C67] mt-0.5">
          Staff profile authentication context and university repository configuration
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#D9D6CC] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E6DD]">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-[#020202] tracking-tight">{user.name}</h2>
              <p className="text-xs text-[#746C67] font-mono mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge roleName={activeRole.name} level={activeRole.level} showLevel />
                <span className="text-[11px] font-mono text-[#746C67]">
                  {user.departmentName}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#F6F4EC] border border-[#D9D6CC] text-xs space-y-1 sm:text-right">
            <p className="text-[10px] uppercase font-mono text-[#746C67]">Active Clearance</p>
            <p className="font-bold text-[#020202]">Hierarchy Tier {activeRole.level}</p>
          </div>
        </div>

        {/* Assigned Roles List */}
        <div>
          <h3 className="text-xs font-bold text-[#020202] uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5FAF82]" />
            <span>Assigned Institutional Roles ({user.roles.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.roles.map(r => {
              const isActive = r.id === activeRole.id;
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#96DDB1]/15 border-[#5FAF82]'
                      : 'bg-[#F6F4EC]/50 border-[#D9D6CC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#020202]">{r.name}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#D9D6CC]">
                      Tier {r.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#746C67] line-clamp-2">{r.description}</p>
                  {isActive && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#5FAF82] uppercase font-mono">
                      ✓ Active in current session
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Security & Architectural Parameters */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#D9D6CC] shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#5FAF82]" />
          <h3 className="font-bold text-sm text-[#020202] uppercase font-mono tracking-wider">
            Repository Architecture & Security Policies
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F6F4EC]/60 border border-[#D9D6CC] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#020202]">
              <Database className="w-4 h-4 text-[#5FAF82]" />
              <span>Database Engine</span>
            </div>
            <p className="text-[#746C67] leading-relaxed">
              PostgreSQL Relational Storage via PGlite embedded engine with ACID transactions and schema integrity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6F4EC]/60 border border-[#D9D6CC] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#020202]">
              <Lock className="w-4 h-4 text-[#5FAF82]" />
              <span>Owner-Only Deletion</span>
            </div>
            <p className="text-[#746C67] leading-relaxed">
              Enforced strictly on the Node.js backend. Even administrators and HoDs cannot delete documents owned by other staff.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6F4EC]/60 border border-[#D9D6CC] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#020202]">
              <Key className="w-4 h-4 text-[#5FAF82]" />
              <span>Authentication Token</span>
            </div>
            <p className="text-[#746C67] leading-relaxed">
              JSON Web Tokens (JWT) with HMAC-SHA256 signing and salted bcrypt password cryptography.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6F4EC]/60 border border-[#D9D6CC] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#020202]">
              <Award className="w-4 h-4 text-[#5FAF82]" />
              <span>University Institution</span>
            </div>
            <p className="text-[#746C67] leading-relaxed">
              GSFC University Enterprise Document Repository. All file downloads stream through authorization filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
