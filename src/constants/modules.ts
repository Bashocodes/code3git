import { ModuleConfig } from '../types';

export const MODULES: ModuleConfig[] = [
  { 
    id: 'STORY', 
    label: 'STORY', 
    icon: 'BookOpen', 
    color: '#B8A082',
    description: 'A tight three-beat narrative scaffold to spark your plot.'
  },
  { 
    id: 'VIDEO', 
    label: 'VIDEO', 
    icon: 'Film', 
    color: '#5A7C9D',
    description: 'Three cinematic video prompts to bring your image to life.'
  },
  { 
    id: 'DIALOGUE', 
    label: 'DIALOGUE', 
    icon: 'Mic', 
    color: '#E67E22',
    description: 'Three punchy dialogue cues to ignite character voice.'
  },
  { 
    id: 'REMIX', 
    label: 'REMIX', 
    icon: 'Zap', 
    color: '#8365AC',
    description: 'Three style-shifting prompts, tuned for instant paste-and-go.'
  },
  { 
    id: 'OUTPAINT', 
    label: 'OUTPAINT', 
    icon: 'Expand', 
    color: '#4AA09F',
    description: 'Seamless edge-extension prompt plus safe-crop guidance.'
  },
  { 
    id: 'MUSIC', 
    label: 'MUSIC', 
    icon: 'Music', 
    color: '#7BB972',
    description: 'Three tailored music prompts—mood, tempo, instrumentation.'
  },
];

export const COLORS = {
  background: '#0E0E0E',
  textPrimary: '#E6E6E6',
  textSecondary: '#7C9A92',
  accentGold: '#D5C3A5',
  cardBackground: '#1A1A1A',
  cardBorder: '#1B1B1B',
};