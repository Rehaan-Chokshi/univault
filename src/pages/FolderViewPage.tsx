import React, { useState } from 'react';
import { Folder, DocumentRecord } from '../types/index.ts';
import { FolderCard } from '../components/FolderCard.tsx';
import { DocumentTable } from '../components/DocumentTable.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { 
  FolderTree, 
  FolderPlus, 
  ArrowLeft, 
  Globe, 
  Building, 
  ShieldCheck, 
  X,
  AlertCircle
} from 'lucide-react';

interface FolderViewPageProps {
  folders: (Folder & { isApplicable?: boolean; statusReason?: string })[];
  documents: DocumentRecord[];
  onRefreshFolders: () => void;
  onOpenUpload: () => void;
  onViewDoc: (doc: DocumentRecord) => void;
  onDownloadDoc: (doc: DocumentRecord) => void;
  onDeleteDoc: (doc: DocumentRecord) => void;
}

export const FolderViewPage: React.FC<FolderViewPageProps> = ({
  folders,
  documents,
  onRefreshFolders,
  onOpenUpload,
  onViewDoc,
  onDownloadDoc,
  onDeleteDoc
}) => {
  const { user, activeRole, apiFetch } = useAuth();
  const { showToast } = useNotification();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderScope, setNewFolderScope] = useState<'GLOBAL' | 'DEPARTMENT'>('DEPARTMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !activeRole) return null;

  const canCreateGlobal = activeRole.level <= 2;
  const canCreateDept = activeRole.level <= 3;
  const canCreateAny = canCreateDept;

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      showToast('error', 'Name Required', 'Please enter a folder name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDesc.trim(),
          scope: newFolderScope,
          departmentId: newFolderScope === 'GLOBAL' ? null : user.departmentId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create folder');
      }

      showToast('success', 'Folder Created', `"${newFolderName}" is now available in repository.`);
      onRefreshFolders();
      setShowCreateModal(false);
      setNewFolderName('');
      setNewFolderDesc('');
    } catch (err: any) {
      showToast('error', 'Folder Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a folder is opened, show its documents
  if (selectedFolder) {
    const folderDocs = documents.filter(d => d.folderId === selectedFolder.id);

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedFolder(null)}
              className="p-2.5 rounded-xl bg-white border border-[#D9D6CC] text-[#746C67] hover:text-[#020202] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#E8E6DD] text-[#746C67]">
                  {selectedFolder.scope}
                </span>
                <span className="text-xs text-[#746C67] font-mono">
                  {folderDocs.length} {folderDocs.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#020202] tracking-tight mt-0.5">
                {selectedFolder.name}
              </h1>
            </div>
          </div>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm"
          >
            <span>+ Upload to this Folder</span>
          </button>
        </div>

        {selectedFolder.description && (
          <div className="p-4 bg-white rounded-2xl border border-[#D9D6CC] text-xs text-[#746C67]">
            {selectedFolder.description}
          </div>
        )}

        <DocumentTable
          documents={folderDocs}
          currentUserId={user.id}
          onView={onViewDoc}
          onDownload={onDownloadDoc}
          onDelete={onDeleteDoc}
        />
      </div>
    );
  }

  // Group folders by scope
  const globalFolders = folders.filter(f => f.scope === 'GLOBAL');
  const deptFolders = folders.filter(f => f.scope === 'DEPARTMENT');

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-[#5FAF82]" />
            <span>Repository Folder Hierarchy</span>
          </h1>
          <p className="text-xs text-[#746C67] mt-0.5">
            Role-governed folder trees. Folders show active status according to your institutional clearance.
          </p>
        </div>

        {canCreateAny && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-[#96DDB1]" />
            <span>Create Folder</span>
          </button>
        )}
      </div>

      {/* Department Folders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CC]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#020202]">
            <Building className="w-4 h-4 text-[#5FAF82]" />
            <span>Department Folders ({user.departmentName})</span>
          </div>
          <span className="text-xs text-[#746C67] font-mono">
            {deptFolders.length} folders
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {deptFolders.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => setSelectedFolder(folder)}
            />
          ))}
        </div>
      </div>

      {/* Global / University-Wide Folders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CC]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#020202]">
            <Globe className="w-4 h-4 text-[#5FAF82]" />
            <span>University-Wide / Executive Archives</span>
          </div>
          <span className="text-xs text-[#746C67] font-mono">
            {globalFolders.length} folders
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {globalFolders.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => setSelectedFolder(folder)}
            />
          ))}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />

          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#D9D6CC] shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DD] mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#020202]">Create Repository Folder</h3>
                <p className="text-xs text-[#746C67] mt-0.5">
                  Authorized creation under role {activeRole.name}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Folder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accreditation Reports 2026"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Scope
                </label>
                <select
                  value={newFolderScope}
                  onChange={e => setNewFolderScope(e.target.value as any)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                >
                  <option value="DEPARTMENT">Department Level ({user.departmentName})</option>
                  {canCreateGlobal && (
                    <option value="GLOBAL">Global University Level (Executive)</option>
                  )}
                </select>
                {!canCreateGlobal && (
                  <p className="text-[10px] text-[#746C67] mt-1 font-mono">
                    * Global folders can only be created by Senior Management or Deans.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this folder..."
                  value={newFolderDesc}
                  onChange={e => setNewFolderDesc(e.target.value)}
                  className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E6DD] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#746C67] hover:text-[#020202] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
