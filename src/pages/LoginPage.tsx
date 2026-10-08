import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  KeyRound, 
  Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'Senior Management',
      tier: 'Level 1',
      name: 'Dr. Rajesh Mehta',
      email: 'senior@university.edu',
      dept: 'Executive Administration'
    },
    {
      role: 'Dean / Administration',
      tier: 'Level 2',
      name: 'Dr. Priya Shah',
      email: 'dean@university.edu',
      dept: 'Academic Affairs'
    },
    {
      role: 'HoD (CSE)',
      tier: 'Level 3',
      name: 'Dr. Amit Patel',
      email: 'hod.cse@university.edu',
      dept: 'Computer Science'
    },
    {
      role: 'Associate HoD (CSE)',
      tier: 'Level 4',
      name: 'Dr. Neha Desai',
      email: 'associatehod.cse@university.edu',
      dept: 'Computer Science'
    },
    {
      role: 'Teaching Staff (CSE)',
      tier: 'Level 5 (Owner Demo)',
      name: 'Rahul Sharma',
      email: 'faculty.cse@university.edu',
      dept: 'Computer Science'
    },
    {
      role: 'Non-Teaching Staff (CSE)',
      tier: 'Level 5',
      name: 'Karan Joshi',
      email: 'staff.cse@university.edu',
      dept: 'Computer Science'
    },
    {
      role: 'Teaching Staff (Mech Eng)',
      tier: 'Level 5 (Dept Isolation)',
      name: 'Prof. Vikram Joshi',
      email: 'faculty.me@university.edu',
      dept: 'Mechanical Engineering'
    }
  ];

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLoading(true);
    const result = await login(demoEmail, 'password123');
    setIsLoading(false);

    if (result.success) {
      showToast('success', 'Authenticated', `Signed in as ${demoEmail}`);
    } else {
      showToast('error', 'Login Failed', result.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('error', 'Required Fields', 'Please enter your university email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      showToast('success', 'Authenticated', 'Welcome to UniVault Repository');
    } else {
      showToast('error', 'Login Failed', result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EC] bg-grid-pattern flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#020202] text-[#96DDB1] font-bold text-base flex items-center justify-center shadow-sm">
            UV
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg text-[#020202]">UniVault</span>
            <span className="text-[10px] text-[#746C67] block font-mono">GSFC UNIVERSITY ARCHIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#746C67]">
          <ShieldCheck className="w-4 h-4 text-[#5FAF82]" />
          <span className="hidden sm:inline">Role-Based Cryptographic Access</span>
        </div>
      </header>

      {/* Main Login Card and Demo Selector */}
      <main className="max-w-5xl mx-auto w-full my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand Narrative & Quick Demo Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#96DDB1]/30 text-[#020202] border border-[#96DDB1]">
              <Sparkles className="w-3.5 h-3.5 text-[#5FAF82]" />
              University Repository Management System
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#020202] tracking-tight leading-[1.15]">
              One Repository. <br />
              Every Document. <br />
              <span className="text-[#5FAF82]">Controlled Access.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#746C67] leading-relaxed max-w-xl">
              Centralized, secure repository for academic, administrative, and departmental records with multi-role hierarchy control and owner-only deletion.
            </p>
          </div>

          {/* Demo Accounts Section */}
          <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border border-[#D9D6CC] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E6DD]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#5FAF82]" />
                <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-[#020202]">
                  Demo Accounts (1-Click Fill & Login)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#746C67]">Password: password123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
              {demoAccounts.map(demo => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo.email)}
                  disabled={isLoading}
                  className="text-left p-2.5 rounded-xl border border-[#D9D6CC] bg-[#F6F4EC]/50 hover:bg-[#96DDB1]/20 hover:border-[#5FAF82] transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#020202] group-hover:text-[#5FAF82] truncate">
                      {demo.name}
                    </span>
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-[#D9D6CC]">
                      {demo.tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#746C67] truncate mt-0.5">
                    {demo.role}
                  </div>
                  <div className="text-[10px] font-mono text-[#746C67]/80 truncate mt-1">
                    {demo.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Professional Login Form */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9D6CC] shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#020202] tracking-tight">University Gateway</h2>
              <p className="text-xs text-[#746C67] mt-1">
                Enter your authorized faculty or staff credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  University Email / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#746C67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. faculty.cse@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] pl-10 pr-3.5 py-3 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#020202] mb-1.5 uppercase font-mono tracking-wider">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#746C67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-xs bg-[#F6F4EC] focus:bg-white text-[#020202] pl-10 pr-3.5 py-3 rounded-xl border border-[#D9D6CC] focus:border-[#5FAF82] focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#020202] text-white hover:bg-[#202020] disabled:opacity-50 transition-all shadow-md group cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#96DDB1] border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Repository</span>
                      <ArrowRight className="w-4 h-4 text-[#96DDB1] group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#E8E6DD] text-center">
              <p className="text-[11px] text-[#746C67] flex items-center justify-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Protected by GSFC University Enterprise Architecture</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full py-2 text-center text-xs text-[#746C67]">
        <p>© 2026 UniVault • GSFC University Repository Management System</p>
      </footer>
    </div>
  );
};
