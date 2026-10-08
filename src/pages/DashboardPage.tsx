import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { FolderCard } from '../components/FolderCard.tsx';
import { DocumentTable } from '../components/DocumentTable.tsx';
import { DocumentRecord, Folder, DashboardStats } from '../types/index.ts';
import { 
  Files, 
  FileText, 
  Share2, 
  Activity, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  FolderTree
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats;
  folders: (Folder & { isApplicable?: boolean; statusReason?: string })[];
  recentDocuments: DocumentRecord[];
  onOpenUpload: () => void;
  onOpenFolder: (folder: Folder) => void;
  onViewDoc: (doc: DocumentRecord) => void;
  onDownloadDoc: (doc: DocumentRecord) => void;
  onDeleteDoc: (doc: DocumentRecord) => void;
  onViewAllDocs: () => void;
  onOpenScenarioModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  folders,
  recentDocuments,
  onOpenUpload,
  onOpenFolder,
  onViewDoc,
  onDownloadDoc,
  onDeleteDoc,
  onViewAllDocs,
  onOpenScenarioModal
}) => {
  const { user, activeRole } = useAuth();

  if (!user || !activeRole) return null;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome & Context Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-[#D9D6CC] shadow-sm overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#96DDB1]/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5FAF82]" />
                TIER {activeRole.level} CLEARANCE
              </span>
              <span className="text-xs text-[#746C67] font-mono">
                {user.departmentCode} DOMAIN
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#020202] tracking-tight">
              Welcome back, {user.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#746C67]">
              <div>
                Role: <strong className="text-[#020202]">{activeRole.name}</strong>
              </div>
              <span>•</span>
              <div>
                Department: <strong className="text-[#020202]">{user.departmentName}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScenarioModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#E8E6DD] hover:bg-[#D9D6CC] text-[#020202] border border-[#D9D6CC] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#5FAF82]" />
              <span>Verify Access Scenario</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#020202] hover:bg-[#202020] text-white shadow-md transition-all"
            >
              <span className="text-[#96DDB1] font-bold text-sm leading-none">+</span>
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Documents"
          value={stats.totalDocuments}
          subtext="Accessible in hierarchy scope"
          icon={Files}
          accent="neutral"
        />
        <StatCard
          label="My Documents"
          value={stats.myDocuments}
          subtext="Uploaded by you (deletable)"
          icon={FileText}
          accent="mint"
        />
        <StatCard
          label="Shared With Me"
          value={stats.sharedWithMe}
          subtext="Colleagues & departmental records"
          icon={Share2}
          accent="neutral"
        />
        <StatCard
          label="Activity"
          value={`${stats.activityCountToday} today`}
          subtext="Cryptographic audit events"
          icon={Activity}
          accent="dark"
        />
      </div>

      {/* Repository Folders (Applicable / Not Applicable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#020202] tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#5FAF82]" />
              <span>Your Repository</span>
            </h2>
            <p className="text-xs text-[#746C67] mt-0.5">
              Role-authorized institutional folders. Non-applicable folders are preserved for organizational structure.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.slice(0, 8).map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => onOpenFolder(folder)}
            />
          ))}
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#020202] tracking-tight">
              Recent Documents
            </h2>
            <p className="text-xs text-[#746C67] mt-0.5">
              Latest documents in your authorized repository scope
            </p>
          </div>

          <button
            onClick={onViewAllDocs}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#020202] hover:text-[#5FAF82] transition-colors"
          >
            <span>View All Repository Files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <DocumentTable
          documents={recentDocuments.slice(0, 6)}
          currentUserId={user.id}
          onView={onViewDoc}
          onDownload={onDownloadDoc}
          onDelete={onDeleteDoc}
        />
      </div>
    </div>
  );
};
