import React from 'react';
import { Folder } from '../types/index.ts';
import { Folder as FolderIcon, Lock, CheckCircle2, Globe, Building } from 'lucide-react';

interface FolderCardProps {
  folder: Folder & { isApplicable?: boolean; statusReason?: string };
  onClick?: () => void;
  onUploadClick?: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onClick, onUploadClick }) => {
  const isApplicable = folder.isApplicable !== false;

  return (
    <div
      onClick={isApplicable ? onClick : undefined}
      className={`relative p-5 rounded-2xl border transition-all duration-200 select-none ${
        isApplicable
          ? 'bg-white border-[#D9D6CC] hover:border-[#5FAF82] hover:shadow-md cursor-pointer'
          : 'bg-[#F6F4EC]/60 border-[#D9D6CC]/70 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={`p-2.5 rounded-xl border ${
            isApplicable
              ? 'bg-[#96DDB1]/20 border-[#96DDB1]/40 text-[#5FAF82]'
              : 'bg-[#E8E6DD] border-[#D9D6CC] text-[#746C67]'
          }`}
        >
          <FolderIcon className="w-5 h-5" />
        </div>

        {/* State Badge: APPLICABLE / NOT APPLICABLE */}
        <div>
          {isApplicable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider font-mono bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
              <CheckCircle2 className="w-3 h-3 text-[#5FAF82]" />
              APPLICABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider font-mono bg-[#E8E6DD] text-[#746C67] border border-[#D9D6CC]">
              <Lock className="w-3 h-3" />
              NOT APPLICABLE
            </span>
          )}
        </div>
      </div>

      <h4 className="font-bold text-sm text-[#020202] tracking-tight line-clamp-1 mb-1">
        {folder.name}
      </h4>

      <p className="text-xs text-[#746C67] line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
        {folder.description || 'Institutional repository records folder'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DD] text-xs">
        <div className="flex items-center gap-1 text-[#746C67]">
          {folder.scope === 'GLOBAL' ? (
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Globe className="w-3 h-3 text-[#5FAF82]" />
              GLOBAL
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[10px] truncate max-w-[120px]">
              <Building className="w-3 h-3" />
              {folder.departmentName || 'DEPT'}
            </span>
          )}
        </div>

        <span className="font-mono text-xs font-semibold text-[#020202]">
          {folder.documentCount ?? 0} {folder.documentCount === 1 ? 'file' : 'files'}
        </span>
      </div>

      {!isApplicable && folder.statusReason && (
        <div className="mt-2 text-[10px] text-[#746C67] bg-[#E8E6DD]/60 p-1.5 rounded-lg border border-[#D9D6CC]/50">
          {folder.statusReason}
        </div>
      )}
    </div>
  );
};
