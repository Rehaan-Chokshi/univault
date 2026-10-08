import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { Folder } from '../types/index.ts';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Tag
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: (Folder & { isApplicable?: boolean })[];
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  onUploadSuccess
}) => {
  const { user, apiFetch } = useAuth();
  const { showToast } = useNotification();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  // Filter folders: only applicable folders can be uploaded to
  const applicableFolders = folders.filter(f => f.isApplicable !== false);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'docx', 'pptx', 'xlsx'];

    if (!ext || !validExts.includes(ext)) {
      showToast('error', 'Unsupported file type', 'Only PDF, DOCX, PPTX and XLSX files are accepted.');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      showToast('error', 'File size exceeds limit', 'Maximum allowed file size is 25 MB.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showToast('error', 'File required', 'Please select a document file to upload.');
      return;
    }

    if (!title.trim()) {
      showToast('error', 'Title required', 'Please enter a document title.');
      return;
    }

    if (!selectedFolderId) {
      showToast('error', 'Folder required', 'Please select an applicable repository folder.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('folderId', selectedFolderId);
      formData.append('departmentId', user.departmentId);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(tags));

      const res = await apiFetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      showToast('success', 'Document Uploaded', `"${title}" has been registered in the university repository.`);
      onUploadSuccess();
      onClose();

      // Reset
      setFile(null);
      setTitle('');
      setDescription('');
      setSelectedFolderId('');
      setTagsInput('');
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#D9D6CC] shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DD] mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#020202]">Upload Institutional Document</h3>
            <p className="text-xs text-[#746C67] mt-0.5">
              Secure upload to {user.departmentName} repository
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div>
            <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
              File Attachment
            </label>
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#5FAF82] bg-[#96DDB1]/10'
                  : file
                  ? 'border-[#96DDB1] bg-[#F6F4EC]/50'
                  : 'border-[#D9D6CC] hover:border-[#746C67] bg-[#F6F4EC]/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.xlsx"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
                    <FileText className="w-6 h-6 text-[#5FAF82]" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#020202] truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-[#746C67] font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for ingestion
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#E8E6DD] flex items-center justify-center mx-auto text-[#020202]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#020202]">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-[11px] text-[#746C67] mt-0.5">
                      Supported formats: <span className="font-semibold text-[#020202]">PDF, DOCX, PPTX, XLSX</span>
                    </p>
                    <p className="text-[10px] text-[#746C67] font-mono mt-1">
                      Maximum file size: 25 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Research Proposal.pdf"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            />
          </div>

          {/* Folder Selector (Strictly Applicable Folders Only) */}
          <div>
            <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
              Repository Folder *
            </label>
            <select
              required
              value={selectedFolderId}
              onChange={e => setSelectedFolderId(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            >
              <option value="">-- Choose Applicable Folder --</option>
              {applicableFolders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.scope === 'GLOBAL' ? 'Global' : f.departmentName || 'Dept'})
                </option>
              ))}
            </select>
            {applicableFolders.length === 0 && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> No applicable folders found for your current active role.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide brief context or summary of document content..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#5FAF82]" />
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. research, grant, cse, neural-network"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] p-2.5 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E8E6DD] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#746C67] hover:text-[#020202] hover:bg-[#E8E6DD] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#96DDB1] border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-[#96DDB1]" />
                  <span>Save to Repository</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
