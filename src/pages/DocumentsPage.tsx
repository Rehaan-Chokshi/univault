import React, { useState } from 'react';
import { DocumentRecord, Folder } from '../types/index.ts';
import { DocumentTable } from '../components/DocumentTable.tsx';
import { 
  Search, 
  Filter, 
  Upload, 
  RefreshCw, 
  FileText, 
  Share2, 
  Files,
  X
} from 'lucide-react';

interface DocumentsPageProps {
  documents: DocumentRecord[];
  folders: Folder[];
  currentUserId: string;
  activeFilter: 'all' | 'my' | 'shared';
  setActiveFilter: (filter: 'all' | 'my' | 'shared') => void;
  onOpenUpload: () => void;
  onViewDoc: (doc: DocumentRecord) => void;
  onDownloadDoc: (doc: DocumentRecord) => void;
  onDeleteDoc: (doc: DocumentRecord) => void;
  onRefresh: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  folders,
  currentUserId,
  activeFilter,
  setActiveFilter,
  onOpenUpload,
  onViewDoc,
  onDownloadDoc,
  onDeleteDoc,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Client filtering on top of server permissions
  const filteredDocuments = documents.filter(doc => {
    // Tab filter
    if (activeFilter === 'my' && doc.ownerId !== currentUserId) return false;
    if (activeFilter === 'shared' && doc.ownerId === currentUserId) return false;

    // Folder filter
    if (selectedFolder && doc.folderId !== selectedFolder) return false;

    // Type filter
    if (selectedType && doc.fileType.toLowerCase() !== selectedType.toLowerCase()) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.ownerName.toLowerCase().includes(q) ||
        doc.departmentName?.toLowerCase().includes(q) ||
        doc.folderName?.toLowerCase().includes(q) ||
        doc.tags?.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#020202] tracking-tight">
            Repository Documents
          </h1>
          <p className="text-xs text-[#746C67] mt-0.5">
            Cryptographically controlled university records repository
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white border border-[#D9D6CC] text-[#746C67] hover:text-[#020202] transition-colors"
            title="Refresh repository"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#96DDB1]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D6CC] space-y-4 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6DD] pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F6F4EC] border border-[#D9D6CC]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-[#020202] shadow-sm'
                  : 'text-[#746C67] hover:text-[#020202]'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>All Documents</span>
            </button>
            <button
              onClick={() => setActiveFilter('my')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'my'
                  ? 'bg-white text-[#020202] shadow-sm'
                  : 'text-[#746C67] hover:text-[#020202]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#5FAF82]" />
              <span>My Documents</span>
            </button>
            <button
              onClick={() => setActiveFilter('shared')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'shared'
                  ? 'bg-white text-[#020202] shadow-sm'
                  : 'text-[#746C67] hover:text-[#020202]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Shared With Me</span>
            </button>
          </div>

          <div className="text-xs text-[#746C67] font-mono">
            Showing <strong>{filteredDocuments.length}</strong> of {documents.length} files
          </div>
        </div>

        {/* Filters and Search row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#746C67] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, description, tags, author..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] pl-9 pr-8 py-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746C67] hover:text-[#020202]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] px-3 py-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            >
              <option value="">All Folders</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] px-3 py-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            >
              <option value="">All Types (PDF, DOCX, XLSX, PPTX)</option>
              <option value="pdf">PDF Documents</option>
              <option value="docx">DOCX Documents</option>
              <option value="xlsx">XLSX Spreadsheets</option>
              <option value="pptx">PPTX Presentations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Document Table */}
      <DocumentTable
        documents={filteredDocuments}
        currentUserId={currentUserId}
        onView={onViewDoc}
        onDownload={onDownloadDoc}
        onDelete={onDeleteDoc}
      />
    </div>
  );
};
