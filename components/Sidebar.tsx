
import React from 'react';
import { Bubble, BubbleColor, COLOR_PALETTE, SortMode } from '../types';
import { BUBBLE_COLORS } from '../constants';
import { Palette, AlignLeft, Plus, Eye, LayoutGrid, X, Infinity as InfinityIcon, CornerUpLeft } from 'lucide-react';

interface Props {
  bubbles: Bubble[];
  onAddBubble: (color: BubbleColor, size: number, isRitual: boolean) => void;
  onSortByColor: () => void;
  onSortByPriority: () => void;
  sortMode: SortMode;
  colorLabels: Record<BubbleColor, string>;
  onLabelChange: (color: BubbleColor, text: string) => void;
  focusedColor: BubbleColor | null;
  onSetFocusedColor: (color: BubbleColor | null) => void;
  onOpenGallery: () => void;
  isGalleryOpen: boolean;
  onToggleGallery: () => void;
  onOpenCreateModal: () => void;
  activePressure: number;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<Props> = ({
  bubbles,
  onAddBubble,
  onSortByColor,
  onSortByPriority,
  sortMode,
  colorLabels,
  onLabelChange,
  focusedColor,
  onSetFocusedColor,
  isGalleryOpen,
  onToggleGallery,
  onOpenCreateModal,
  activePressure,
  isMobileOpen,
  onMobileClose
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-slate-950 flex flex-col py-4 md:py-6 px-4 z-[110] overflow-hidden border-slate-900 shadow-2xl
        md:w-80 md:border-l md:relative
        fixed bottom-0 left-0 right-0 rounded-t-[32px] border-t
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        max-h-[75vh] md:max-h-none
      `}>
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center mb-3">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        <button
        onClick={onToggleGallery}
        className={`w-full py-3 md:py-4 mb-3 md:mb-4 rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all border font-black text-[10px] md:text-xs tracking-widest uppercase
          ${isGalleryOpen
            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/40'
            : 'bg-slate-900 text-indigo-400 border-slate-800 hover:bg-slate-800 hover:text-white'}
        `}
      >
        {isGalleryOpen ? <CornerUpLeft size={16} className="md:w-[18px] md:h-[18px]" /> : <LayoutGrid size={16} className="md:w-[18px] md:h-[18px]" />}
        {isGalleryOpen ? 'Return' : 'Gallery View'}
      </button>

      <div className={`flex-1 flex flex-col transition-all duration-500 ${isGalleryOpen ? 'opacity-20 pointer-events-none grayscale blur-[1px]' : 'opacity-100'}`}>
        <div className="flex gap-2 mb-3 md:mb-4">
          <button
            onClick={onSortByColor}
            title="Sort by Color"
            className={`h-10 md:h-12 flex-1 flex items-center justify-center rounded-xl transition-all border
              ${sortMode === 'color'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <Palette size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
          <button
            onClick={onSortByPriority}
            title="Sort by Priority"
            className={`h-10 md:h-12 flex-1 flex items-center justify-center rounded-xl transition-all border
              ${sortMode === 'priority'
                ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <AlignLeft size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-8 bg-slate-900/30 p-2 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center gap-1">
            {BUBBLE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onAddBubble(color, 3, false)}
                disabled={activePressure >= 100}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md border-2 ${COLOR_PALETTE[color].bg} ${COLOR_PALETTE[color].border} hover:border-white/40 disabled:opacity-20 disabled:grayscale`}
              >
                <Plus className={COLOR_PALETTE[color].text} size={16} />
              </button>
            ))}
          </div>
          <button
            onClick={() => onAddBubble('blue', 3, true)}
            disabled={activePressure >= 100}
            className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20"
          >
            <InfinityIcon size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Persistent Bubbl</span>
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {BUBBLE_COLORS.map(color => {
            const hasColor = bubbles.some(b => b.color === color);
            const palette = COLOR_PALETTE[color];
            const isFocused = focusedColor === color;

            return (
              <div key={color} className={`flex items-center gap-3 transition-all duration-300 px-1 py-0.5 rounded-xl ${hasColor ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                <button 
                  onClick={() => onSetFocusedColor(isFocused ? null : color)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm 
                    ${isFocused ? `${palette.focus} text-white shadow-lg shadow-${color}-500/20` : `bg-slate-900 border border-slate-800 ${palette.text}`}
                  `}
                >
                  <Eye size={16} strokeWidth={2.0} />
                </button>
                <input 
                  value={colorLabels[color]}
                  onChange={(e) => onLabelChange(color, e.target.value)}
                  placeholder="Label..."
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-slate-200 font-medium"
                />
              </div>
            );
          })}
        </div>

        <div className="pt-4 md:pt-6">
          <button
            onClick={onOpenCreateModal}
            disabled={activePressure >= 100}
            className={`w-full py-3 md:py-4 rounded-[20px] flex items-center justify-center gap-2 text-white shadow-xl transition-all duration-300 border border-white/10 font-bold tracking-widest uppercase text-[10px] md:text-xs
              ${activePressure >= 100 ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-gradient-to-tr from-indigo-600 to-purple-500 hover:scale-[1.02] active:scale-[0.98]'}
            `}
          >
            CREATE BUBBL
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
