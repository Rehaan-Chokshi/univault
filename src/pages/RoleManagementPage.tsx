import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { RoleBadge } from '../components/RoleBadge.tsx';
import { 
  ShieldAlert, 
  RefreshCw, 
  Users, 
  Check, 
  X, 
  Lock, 
  Info,
  Layers
} from 'lucide-react';

interface RoleDetail {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  permissions: string[];
  userCount: number;
}

export const RoleManagementPage: React.FC = () => {
  const { apiFetch, activeRole } = useAuth();
  const { showToast } = useNotification();

  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const allSystemPermissions = [
    { key: 'VIEW_DOCUMENTS', label: 'View Documents', desc: 'Browse authorized documents' },
    { key: 'DOWNLOAD_DOCUMENTS', label: 'Download Documents', desc: 'Securely download file attachments' },
    { key: 'UPLOAD_DOCUMENTS', label: 'Upload Documents', desc: 'Upload to applicable departmental folders' },
    { key: 'CREATE_DEPT_FOLDERS', label: 'Create Dept Folders', desc: 'Create departmental repository folders' },
    { key: 'CREATE_GLOBAL_FOLDERS', label: 'Create Global Folders', desc: 'Create university-wide folders' },
    { key: 'MANAGE_USERS', label: 'Manage Users', desc: 'Register staff and configure permissions' },
    { key: 'MANAGE_ROLES', label: 'Manage Roles', desc: 'Modify institutional governance policies' },
    { key: 'VIEW_AUDIT_LOGS', label: 'View Audit Logs', desc: 'Access full institutional security ledger' }
  ];

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#5FAF82]" />
            <span>Role & Hierarchy Management</span>
          </h1>
          <p className="text-xs text-[#746C67] mt-0.5">
            5-tier institutional access control hierarchy matrix for GSFC University
          </p>
        </div>

        <button
          onClick={fetchRoles}
          className="p-2.5 rounded-xl bg-white border border-[#D9D6CC] text-[#746C67] hover:text-[#020202] transition-colors self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hierarchy Overview Guide Banner */}
      <div className="p-5 bg-white rounded-2xl border border-[#D9D6CC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#96DDB1]/20 border border-[#96DDB1]/40 text-[#5FAF82] shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#020202]">Hierarchical Access Rule Engine</h4>
            <p className="text-xs text-[#746C67] mt-0.5 max-w-2xl leading-relaxed">
              Higher-tier levels (Tier 1 & 2) possess university-wide archival oversight. Department Heads (Tier 3) govern their academic discipline. Lower-tier users (Tier 5) are strictly isolated to authorized department folders. <strong>Owner-only deletion is enforced unconditionally across all tiers.</strong>
            </p>
          </div>
        </div>

        <span className="font-mono text-xs px-3 py-1 rounded-xl bg-[#F6F4EC] border border-[#D9D6CC] text-[#020202] whitespace-nowrap self-start md:self-auto">
          Clearance Tiers: 1 to 5
        </span>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map(role => (
          <div
            key={role.id}
            className="p-6 bg-white rounded-3xl border border-[#D9D6CC] shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <RoleBadge roleName={role.name} level={role.level} showLevel />
                <span className="font-mono text-xs font-bold text-[#746C67] bg-[#F6F4EC] px-2.5 py-0.5 rounded-full border border-[#D9D6CC]">
                  Hierarchy Level: {role.level}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-[#020202] tracking-tight">
                {role.name}
              </h3>
              <p className="text-xs text-[#746C67] mt-1 leading-relaxed min-h-[36px]">
                {role.description}
              </p>
            </div>

            {/* Permission Checklist */}
            <div className="space-y-2 pt-3 border-t border-[#E8E6DD]">
              <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#746C67]">
                Granted Permissions
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allSystemPermissions.map(perm => {
                  const hasPerm = role.permissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        hasPerm
                          ? 'bg-[#96DDB1]/15 text-[#020202] border border-[#96DDB1]/40'
                          : 'bg-[#F6F4EC]/50 text-[#746C67]/60'
                      }`}
                    >
                      <span className="truncate">{perm.label}</span>
                      {hasPerm ? (
                        <Check className="w-3.5 h-3.5 text-[#5FAF82] shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[#D9D6CC] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User count footer */}
            <div className="pt-3 border-t border-[#E8E6DD] flex items-center justify-between text-xs text-[#746C67]">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{role.userCount} Active Users</span>
              </div>
              <span className="font-mono text-[10px] text-[#5FAF82]">System Protected</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
