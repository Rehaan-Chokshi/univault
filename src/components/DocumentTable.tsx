import React from 'react';
import { DocumentRecord } from '../types/index.ts';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  FileSpreadsheet, 
  Presentation, 
  File,
  Lock,
  Calendar,
  Building,
  User as UserIcon
} from 'lucide-react';

interface DocumentTableProps {
  documents: DocumentRecord[];
  currentUserId: string;
  onView: (doc: DocumentRecord) => void;
  onDownload: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  currentUserId,
  onView,
  onDownload,
  onDelete
}) => {
  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (t === 'xlsx' || t === 'xls') return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (t === 'pptx' || t === 'ppt') return <Presentation className="w-4 h-4 text-orange-500" />;
    if (t === 'docx' || t === 'doc') return <FileText className="w-4 h-4 text-blue-600" />;
    return <File className="w-4 h-4 text-[#746C67]" />;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#D9D6CC]">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#E8E6DD] flex items-center justify-center text-[#746C67] mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-[#020202]">No documents accessible</h4>
        <p className="text-xs text-[#746C67] mt-1 max-w-sm mx-auto">
          No records match your active permissions or filter criteria. Check your active role or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9D6CC] overflow-hidden shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D9D6CC] bg-[#F6F4EC]/60 text-[11px] font-mono uppercase tracking-wider text-[#746C67]">
              <th className="py-3 px-4 font-semibold">Document Name</th>
              <th className="py-3 px-3 font-semibold">Type</th>
              <th className="py-3 px-3 font-semibold">Folder</th>
              <th className="py-3 px-3 font-semibold">Owner</th>
              <th className="py-3 px-3 font-semibold">Department</th>
              <th className="py-3 px-3 font-semibold">Uploaded</th>
              <th className="py-3 px-3 font-semibold">Size</th>
              <th className="py-3 px-3 font-semibold">Access</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DD] text-xs">
            {documents.map(doc => {
              const isOwner = doc.ownerId === currentUserId;
              return (
                <tr
                  key={doc.id}
                  className="hover:bg-[#F6F4EC]/50 transition-colors group"
                >
                  {/* Name + Title */}
                  <td className="py-3.5 px-4 font-medium text-[#020202] max-w-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#F6F4EC] border border-[#D9D6CC] shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0">
                        <span
                          onClick={() => onView(doc)}
                          className="font-bold text-[#020202] hover:text-[#5FAF82] cursor-pointer truncate block"
                          title={doc.title}
                        >
                          {doc.title}
                        </span>
                        <span className="text-[11px] text-[#746C67] truncate block font-mono">
                          {doc.fileName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3 uppercase font-mono font-bold text-[10px] text-[#746C67]">
                    <span className="px-2 py-0.5 rounded bg-[#E8E6DD] border border-[#D9D6CC]">
                      {doc.fileType}
                    </span>
                  </td>

                  {/* Folder */}
                  <td className="py-3.5 px-3 text-[#020202] font-medium">
                    <span className="px-2.5 py-1 rounded-lg bg-[#F6F4EC] border border-[#D9D6CC] text-[11px]">
                      {doc.folderName}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-3 text-[#020202]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate max-w-[120px]">{doc.ownerName}</span>
                      {isOwner && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#96DDB1]/40 text-[#020202] font-bold border border-[#96DDB1]">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-3 text-[#746C67]">
                    <span className="truncate block max-w-[130px] font-medium text-[11px]" title={doc.departmentName}>
                      {doc.departmentName}
                    </span>
                  </td>

                  {/* Uploaded */}
                  <td className="py-3.5 px-3 text-[#746C67] font-mono text-[11px] whitespace-nowrap">
                    {formatDate(doc.createdAt)}
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-3 text-[#746C67] font-mono text-[11px] whitespace-nowrap">
                    {doc.fileSizeFormatted}
                  </td>

                  {/* Access Status */}
                  <td className="py-3.5 px-3">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                      title={doc.permissionReason}
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Authorized</span>
                    </span>
                  </td>

                  {/* Actions: View, Download, Delete (ONLY IF OWNER!) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onView(doc)}
                        className="p-1.5 rounded-lg text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
                        title="View details & preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDownload(doc)}
                        className="p-1.5 rounded-lg text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
                        title="Download securely"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* STRICT: DELETE BUTTON ONLY RENDERS FOR OWNER */}
                      {isOwner ? (
                        <button
                          onClick={() => onDelete(doc)}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete document (Owner only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-1.5 text-[#D9D6CC] cursor-not-allowed"
                          title="Protected: Only document owner can delete"
                        >
                          <Lock className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden divide-y divide-[#E8E6DD]">
        {documents.map(doc => {
          const isOwner = doc.ownerId === currentUserId;
          return (
            <div key={doc.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#F6F4EC] border border-[#D9D6CC] shrink-0 mt-0.5">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <h4
                      onClick={() => onView(doc)}
                      className="font-bold text-sm text-[#020202] truncate"
                    >
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-[#746C67] font-mono truncate">{doc.fileName}</p>
                  </div>
                </div>

                <span className="uppercase font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-[#E8E6DD] text-[#746C67] border border-[#D9D6CC] shrink-0">
                  {doc.fileType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#746C67] pt-1">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{doc.ownerName}</span>
                  {isOwner && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#96DDB1]/40 text-[#020202] font-bold">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{doc.departmentName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
                <div className="font-mono text-[11px]">
                  {doc.fileSizeFormatted}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DD]">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8E6DD] text-[#020202]">
                  {doc.folderName}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(doc)}
                    className="p-1.5 rounded-lg bg-[#F6F4EC] text-[#020202] border border-[#D9D6CC]"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload(doc)}
                    className="p-1.5 rounded-lg bg-[#F6F4EC] text-[#020202] border border-[#D9D6CC]"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
