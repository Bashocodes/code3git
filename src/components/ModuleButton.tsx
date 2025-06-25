import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ModuleConfig } from '../types';

interface ModuleButtonProps {
  module: ModuleConfig;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function ModuleButton({ module, isSelected, isDisabled, onClick }: ModuleButtonProps) {
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[module.icon];

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
        isDisabled
          ? 'bg-white/5 text-white/30 cursor-not-allowed'
          : isSelected
          ? 'text-[#1a1a1a]'
          : 'bg-white/10 text-white/50 hover:bg-white/20'
      }`}
      style={
        isSelected && !isDisabled
          ? { backgroundColor: module.color }
          : {}
      }
    >
      <div className="flex items-center gap-2">
        {IconComponent && <IconComponent size={16} />}
        <span>{module.label}</span>
      </div>
    </button>
  );
}