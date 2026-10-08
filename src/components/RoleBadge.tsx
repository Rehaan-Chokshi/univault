import React from 'react';
import { HierarchyLevel } from '../types/index.ts';

interface RoleBadgeProps {
  roleName: string;
  level?: HierarchyLevel;
  className?: string;
  showLevel?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ roleName, level, className = '', showLevel = false }) => {
  // Color accents based on hierarchy
  let badgeColor = 'bg-[#E8E6DD] text-[#020202] border-[#D9D6CC]';

  if (level === 1 || roleName.includes('Senior')) {
    badgeColor = 'bg-[#020202] text-white border-[#020202]';
  } else if (level === 2 || roleName.includes('Dean') || roleName.includes('Admin')) {
    badgeColor = 'bg-[#96DDB1]/30 text-[#020202] border-[#96DDB1]';
  } else if (level === 3 || roleName.includes('HoD') && !roleName.includes('Associate')) {
    badgeColor = 'bg-[#5FAF82]/20 text-[#020202] border-[#5FAF82]/40';
  } else if (level === 4 || roleName.includes('Associate')) {
    badgeColor = 'bg-[#E8E6DD] text-[#020202] border-[#D9D6CC]';
  } else {
    badgeColor = 'bg-white text-[#746C67] border-[#D9D6CC]';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor} ${className}`}
    >
      <span className="truncate">{roleName}</span>
      {showLevel && level && (
        <span className="opacity-70 text-[10px] uppercase font-mono tracking-wider ml-0.5">
          L{level}
        </span>
      )}
    </span>
  );
};
