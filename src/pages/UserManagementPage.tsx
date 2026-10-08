import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { RoleBadge } from '../components/RoleBadge.tsx';
import { UserAvatar } from '../components/UserAvatar.tsx';
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  Building, 
  CheckCircle, 
  XCircle, 
  X,
  Mail,
  Shield
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  createdAt: string;
  roles: { id: string; name: string; level: number }[];
}

export const UserManagementPage: React.FC = () => {
  const { apiFetch, activeRole } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, dRes, rRes] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/stats/departments'),
        apiFetch('/api/roles')
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setAvailableRoles(rData.roles || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await apiFetch(`/api/users/${user.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        showToast('success', 'Status Updated', `${user.name} is now ${nextStatus}`);
        setUsers(prev =>
          prev.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
      } else {
        const data = await res.json();
        showToast('error', 'Update Failed', data.error);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !departmentId || selectedRoleIds.length === 0) {
      showToast('error', 'Required Fields', 'Please complete all required fields and select at least one role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          departmentId,
          roleIds: selectedRoleIds,
          password: 'password123'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      showToast('success', 'User Registered', `${name.trim()} added with default password password123`);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setDepartmentId('');
      setSelectedRoleIds([]);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#5FAF82]" />
            <span>Institutional User Management</span>
          </h1>
          <p className="text-xs text-[#746C67] mt-0.5">
            Administer faculty profiles, department associations, and multi-role assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white border border-[#D9D6CC] text-[#746C67] hover:text-[#020202] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-[#96DDB1]" />
            <span>Register Staff Account</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#D9D6CC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D9D6CC] bg-[#F6F4EC]/60 text-[11px] font-mono uppercase tracking-wider text-[#746C67]">
                <th className="py-3 px-4 font-semibold">Staff Name & Email</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Assigned Roles</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DD]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F6F4EC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={u.name} size="md" />
                      <div>
                        <p className="font-bold text-[#020202]">{u.name}</p>
                        <p className="text-[11px] text-[#746C67] font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#020202]">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#746C67]" />
                      <span>{u.departmentName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {u.roles.map(r => (
                        <RoleBadge key={r.id} roleName={r.name} level={r.level as any} showLevel />
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span>{u.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#746C67] whitespace-nowrap">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                        u.status === 'ACTIVE'
                          ? 'text-red-700 hover:bg-red-50 border border-red-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#D9D6CC] shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DD] mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#020202]">Register University Staff</h3>
                <p className="text-xs text-[#746C67] mt-0.5">
                  Creates credential with default password <span className="font-mono text-[#020202]">password123</span>
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-[#746C67] hover:text-[#020202] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Rao"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  University Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. srao@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Academic / Administrative Department *
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Assign Roles (Multiple Roles Allowed) *
                </label>
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#F6F4EC] border border-[#D9D6CC] max-h-48 overflow-y-auto">
                  {availableRoles.map(r => {
                    const isChecked = selectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleRoleSelection(r.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-white font-semibold border border-[#96DDB1]' : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-[#5FAF82] focus:ring-0"
                          />
                          <span>{r.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#746C67]">Tier {r.level}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6DD] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#746C67] hover:text-[#020202]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
