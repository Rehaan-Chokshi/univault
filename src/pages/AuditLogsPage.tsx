import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  History, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  User, 
  Folder, 
  Lock,
  Download,
  Trash2,
  Upload
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { apiFetch, activeRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Login', 'Documents', 'Folders', 'Users', 'Security'];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiFetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('UPLOAD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
          <Upload className="w-3 h-3 text-[#5FAF82]" />
          UPLOADED
        </span>
      );
    }
    if (action.includes('DOWNLOAD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-900 border border-blue-200">
          <Download className="w-3 h-3 text-blue-600" />
          DOWNLOADED
        </span>
      );
    }
    if (action.includes('VIEW')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E8E6DD] text-[#020202] border border-[#D9D6CC]">
          VIEWED
        </span>
      );
    }
    if (action.includes('DELETE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-50 text-red-900 border border-red-200">
          <Trash2 className="w-3 h-3 text-red-600" />
          DELETED
        </span>
      );
    }
    if (action.includes('FOLDER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
          <Folder className="w-3 h-3 text-amber-600" />
          FOLDER
        </span>
      );
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-50 text-purple-900 border border-purple-200">
          <Lock className="w-3 h-3 text-purple-600" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#F6F4EC] text-[#020202] border border-[#D9D6CC]">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#5FAF82]" />
            <span>Cryptographic Activity & Audit Trail</span>
          </h1>
          <p className="text-xs text-[#746C67] mt-0.5">
            Immutable university ledger recording document operations, access events, and credential transitions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D6CC] text-xs font-semibold text-[#020202] hover:bg-[#E8E6DD] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D6CC] space-y-4 shadow-sm">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6DD] pb-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F6F4EC] border border-[#D9D6CC]">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-white text-[#020202] shadow-sm'
                    : 'text-[#746C67] hover:text-[#020202]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#746C67] font-mono">
            {logs.length} audit records
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#746C67] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff name, action, document title, or IP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] pl-9 pr-24 py-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#020202] text-white text-[11px] font-bold rounded-lg hover:bg-[#202020]"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#D9D6CC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D9D6CC] bg-[#F6F4EC]/60 text-[11px] font-mono uppercase tracking-wider text-[#746C67]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">Details</th>
                <th className="py-3 px-4 font-semibold text-right">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DD] text-xs">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-[#F6F4EC]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#746C67] whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#020202]">{log.userName}</div>
                    <div className="text-[10px] text-[#746C67] font-mono">{log.userRole}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#020202] max-w-xs truncate">
                    {log.target}
                  </td>
                  <td className="py-3.5 px-4 text-[#746C67] max-w-sm truncate text-[11px]">
                    {log.details || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-[#746C67] text-right whitespace-nowrap">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#746C67]">
                    No audit log records found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
