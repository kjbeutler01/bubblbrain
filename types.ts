
export type BubbleColor = 'blue' | 'green' | 'yellow' | 'purple' | 'red';
export type SortMode = 'none' | 'color' | 'priority';

export interface Bubble {
  id: string;
  text: string;
  description?: string;
  color: BubbleColor;
  size: number; // 1 to 5
  isPersistent?: boolean;
  isRitual?: boolean; // New ritual bubble type
  lastShrunkAt?: number; // Timestamp for reset logic
  isCompleted?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Workspace {
  id: string;
  name: string;
  bubbles: Bubble[];
}

export const COLOR_PALETTE: Record<BubbleColor, { bg: string; border: string; focus: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-400/50', focus: 'bg-blue-500', text: 'text-blue-200' },
  green: { bg: 'bg-emerald-500/10', border: 'border-emerald-400/50', focus: 'bg-emerald-500', text: 'text-emerald-200' },
  yellow: { bg: 'bg-amber-500/10', border: 'border-amber-400/50', focus: 'bg-amber-500', text: 'text-amber-200' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-400/50', focus: 'bg-purple-500', text: 'text-purple-200' },
  red: { bg: 'bg-rose-500/10', border: 'border-rose-400/50', focus: 'bg-rose-500', text: 'text-rose-200' },
};

export const SIZES = [30, 45, 60, 75, 90]; // Radii
