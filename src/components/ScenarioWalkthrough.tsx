import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  UserCheck,
  Building2,
  Lock
} from 'lucide-react';

interface ScenarioWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (email: string) => void;
}

export const ScenarioWalkthrough: React.FC<ScenarioWalkthroughProps> = ({
  isOpen,
  onClose,
  onSelectUser
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      role: 'Teaching Staff (CSE)',
      email: 'faculty.cse@university.edu',
      name: 'Rahul Sharma',
      dept: 'Computer Science & Engineering',
      level: 5,
      docTarget: 'AI Research Proposal.pdf',
      rights: { view: true, download: true, delete: true },
      description: 'Rahul is the original uploader and owner of "AI Research Proposal.pdf". As owner, he has full authority.',
      rule: 'Owner has View = YES, Download = YES, Delete = YES.'
    },
    {
      step: 2,
      role: 'Head of Department (CSE)',
      email: 'hod.cse@university.edu',
      name: 'Dr. Amit Patel',
      dept: 'Computer Science & Engineering',
      level: 3,
      docTarget: 'AI Research Proposal.pdf',
      rights: { view: true, download: true, delete: false },
      description: 'Dr. Patel is HoD for the same department. He can view and download department proposals under Level 3 oversight.',
      rule: 'Owner-Only Deletion: Even the HoD CANNOT delete Rahul\'s document! (Delete = NO)'
    },
    {
      step: 3,
      role: 'Teaching Staff (Mechanical)',
      email: 'faculty.me@university.edu',
      name: 'Prof. Vikram Joshi',
      dept: 'Mechanical Engineering',
      level: 5,
      docTarget: 'AI Research Proposal.pdf',
      rights: { view: false, download: false, delete: false },
      description: 'Prof. Joshi belongs to Mechanical Engineering. Lower-level faculty cannot access documents from unrelated academic departments.',
      rule: 'Department Isolation: View = NO, Download = NO, Delete = NO.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#D9D6CC] shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#E8E6DD] mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
              <Sparkles className="w-6 h-6 text-[#5FAF82]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#020202] tracking-tight">
                Access-Control Demonstration Scenario
              </h3>
              <p className="text-xs text-[#746C67] mt-0.5">
                Target verification for the core PS-1 MVS evaluation scenario
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

        {/* Current logged-in state */}
        <div className="mb-6 p-4 rounded-2xl bg-[#F6F4EC] border border-[#D9D6CC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#5FAF82]" />
            <span>Currently logged in as:</span>
            <strong className="text-[#020202]">{user?.name}</strong>
            <span className="text-[#746C67]">({user?.email})</span>
          </div>
          <div className="flex items-center gap-2 text-[#746C67]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dept: <strong className="text-[#020202]">{user?.departmentName}</strong></span>
          </div>
        </div>

        {/* 3 Steps Matrix */}
        <div className="space-y-4">
          {steps.map(s => {
            const isCurrent = user?.email.toLowerCase() === s.email.toLowerCase();

            return (
              <div
                key={s.step}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#96DDB1]/10 border-[#5FAF82] shadow-sm'
                    : 'bg-white border-[#D9D6CC] hover:border-[#746C67]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#020202] text-white flex items-center justify-center font-mono text-xs font-bold">
                      {s.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#020202] flex items-center gap-2">
                        {s.name}
                        <span className="font-normal text-xs text-[#746C67] font-mono">
                          ({s.role})
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#746C67] font-mono">{s.email}</p>
                    </div>
                  </div>

                  {/* Test button */}
                  <div>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#5FAF82] text-white">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Active Demo User
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectUser(s.email);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#E8E6DD] hover:bg-[#020202] hover:text-white text-[#020202] border border-[#D9D6CC] transition-all"
                      >
                        <span>Switch to this User</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#746C67] mb-3 leading-relaxed">
                  {s.description}
                </p>

                {/* Permissions Breakdown Matrix */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#E8E6DD] text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F6F4EC]/60 border border-[#D9D6CC]">
                    {s.rights.view ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5FAF82]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <span className="text-[10px] text-[#746C67] uppercase font-mono block">View</span>
                      <strong className={s.rights.view ? 'text-[#020202]' : 'text-red-700'}>
                        {s.rights.view ? 'YES' : 'NO'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F6F4EC]/60 border border-[#D9D6CC]">
                    {s.rights.download ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5FAF82]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <span className="text-[10px] text-[#746C67] uppercase font-mono block">Download</span>
                      <strong className={s.rights.download ? 'text-[#020202]' : 'text-red-700'}>
                        {s.rights.download ? 'YES' : 'NO'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F6F4EC]/60 border border-[#D9D6CC]">
                    {s.rights.delete ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5FAF82]" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <span className="text-[10px] text-[#746C67] uppercase font-mono block">Delete</span>
                      <strong className={s.rights.delete ? 'text-[#5FAF82]' : 'text-red-700'}>
                        {s.rights.delete ? 'YES (Owner)' : 'NO (Owner Only)'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[11px] font-mono text-[#5FAF82] bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  {s.rule}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E8E6DD] text-center">
          <p className="text-xs text-[#746C67]">
            UniVault enforces these checks both in the user interface and at the PostgreSQL/Node.js API endpoint layer.
          </p>
        </div>
      </div>
    </div>
  );
};
