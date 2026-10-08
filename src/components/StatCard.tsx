import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  accent?: 'mint' | 'neutral' | 'dark';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  accent = 'neutral',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative p-5 bg-white rounded-2xl border border-[#D9D6CC] transition-all duration-200 shadow-sm ${
        onClick ? 'cursor-pointer hover:border-[#5FAF82] hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold font-mono text-[#746C67]">
            {label}
          </p>
          <h3 className="text-3xl font-bold tracking-tight text-[#020202] mt-1.5 font-sans">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-[#746C67] mt-1 font-medium">{subtext}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl border transition-colors ${
            accent === 'mint'
              ? 'bg-[#96DDB1]/20 border-[#96DDB1]/50 text-[#5FAF82]'
              : accent === 'dark'
              ? 'bg-[#020202] border-[#020202] text-[#96DDB1]'
              : 'bg-[#F6F4EC] border-[#D9D6CC] text-[#020202]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
