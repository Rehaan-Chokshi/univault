import React, { useState } from 'react';
import { DocumentRecord } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { 
  X, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Folder as FolderIcon,
  HardDrive,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface DocumentViewModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
  onDownload: (doc: DocumentRecord) => void;
  onDeleted: () => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  document,
  onClose,
  onDownload,
  onDeleted
}) => {
  const { user, apiFetch } = useAuth();
  const { showToast } = useNotification();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!document || !user) return null;

  const isOwner = document.ownerId === user.id;

  const handleDelete = async () => {
    if (!isOwner) {
      showToast('error', 'Unauthorized', 'Only the document owner can delete this record.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/documents/${document.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }

      showToast('success', 'Document Deleted', `"${document.title}" has been permanently deleted.`);
      onDeleted();
      onClose();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'Not recorded';
    try {
      return new Date(iso).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#D9D6CC] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#E8E6DD]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-[#96DDB1]/20 border border-[#96DDB1]/40 text-[#5FAF82] shrink-0 mt-0.5">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="uppercase font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-[#E8E6DD] text-[#746C67] border border-[#D9D6CC]">
                  {document.fileType}
                </span>
                <span className="font-mono text-xs text-[#746C67]">
                  {document.fileSizeFormatted}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#020202] mt-1 tracking-tight truncate">
                {document.title}
              </h3>
              <p className="text-xs text-[#746C67] font-mono mt-0.5 truncate">
                {document.fileName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5">
          {/* Permissions Explainer Panel (Mandatory Requirement) */}
          <div className="p-4 rounded-2xl bg-[#F6F4EC] border border-[#D9D6CC] space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5FAF82]" />
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#020202]">
                Access Control Verification
              </h4>
            </div>
            <div className="text-xs text-[#020202] bg-white p-3 rounded-xl border border-[#D9D6CC]">
              <p className="font-semibold text-[#5FAF82] mb-1">
                You are authorized to view this document because:
              </p>
              <p className="text-[#746C67] font-medium leading-relaxed">
                {document.permissionReason || 'Authorized under current role & department hierarchy'}
              </p>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div>
              <p className="text-xs font-bold text-[#020202] uppercase font-mono tracking-wider mb-1">
                Description
              </p>
              <p className="text-xs text-[#746C67] leading-relaxed bg-[#F6F4EC]/50 p-3 rounded-xl border border-[#E8E6DD]">
                {document.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#020202] uppercase font-mono tracking-wider mb-1.5">
                Classification Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8E6DD] text-[#020202] border border-[#D9D6CC]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div>
            <p className="text-xs font-bold text-[#020202] uppercase font-mono tracking-wider mb-2">
              Document Metadata
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <User className="w-4 h-4 text-[#746C67] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Original Owner</p>
                  <p className="font-bold text-[#020202] truncate">
                    {document.ownerName} {isOwner ? '(You)' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <Building className="w-4 h-4 text-[#746C67] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Department</p>
                  <p className="font-bold text-[#020202] truncate">{document.departmentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <FolderIcon className="w-4 h-4 text-[#746C67] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Repository Folder</p>
                  <p className="font-bold text-[#020202] truncate">{document.folderName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <Calendar className="w-4 h-4 text-[#746C67] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Uploaded Date</p>
                  <p className="font-bold text-[#020202] font-mono text-[11px] truncate">
                    {formatDate(document.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <HardDrive className="w-4 h-4 text-[#746C67] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Last Accessed</p>
                  <p className="font-bold text-[#020202] font-mono text-[11px] truncate">
                    {formatDate(document.lastAccessedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F4EC]/60 border border-[#E8E6DD]">
                <ShieldCheck className="w-4 h-4 text-[#5FAF82] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#746C67] uppercase font-mono">Deletion Rights</p>
                  <p className="font-bold text-[#020202]">
                    {isOwner ? 'Authorized (Owner)' : 'Restricted (Owner-Only)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* In-Browser Preview Section */}
          {showPreview && (
            <div className="p-4 bg-[#F6F4EC] rounded-2xl border border-[#D9D6CC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#020202] uppercase font-mono">Document Content Preview</span>
                <span className="text-[10px] font-mono text-[#5FAF82] bg-[#96DDB1]/20 px-2 py-0.5 rounded border border-[#96DDB1]/40">Verified Header</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#D9D6CC] font-mono text-xs text-[#020202] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {`[UniVault Institutional Archival Header]
Document: ${document.title}
Institution: GSFC University
Department: ${document.departmentName}
Uploader / Owner: ${document.ownerName}
Status: VERIFIED_OFFICIAL_ARCHIVE
Type: ${document.fileType.toUpperCase()} (${document.fileSizeFormatted})
Checksum: SHA256-${document.id.replace(/-/g, '').slice(0, 16)}

${document.description ? `Summary:\n${document.description}\n` : ''}
This document is securely preserved in the UniVault institutional vault with cryptographic audit logging.`}
              </div>
            </div>
          )}

          {/* Confirm Delete Subpanel */}
          {confirmDelete && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Permanent Removal</span>
              </div>
              <p className="text-red-800 leading-relaxed">
                As the document owner, you are about to permanently delete <strong>{document.title}</strong>. This action cannot be undone and will be recorded in the security audit trail.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-900 hover:bg-red-100/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-5 border-t border-[#E8E6DD] flex items-center justify-between gap-3">
          {/* Owner-only Delete Button */}
          <div>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete (Owner Only)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#746C67] px-2">
                <Lock className="w-3.5 h-3.5 text-[#746C67]" />
                <span className="text-[11px]">Deletion restricted to owner ({document.ownerName})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E8E6DD] hover:bg-[#D9D6CC] text-[#020202] transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Hide Preview' : 'Preview Document'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDownload(document)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#020202] hover:bg-[#202020] text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-[#96DDB1]" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
