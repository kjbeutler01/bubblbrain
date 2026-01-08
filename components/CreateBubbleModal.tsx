
import React, { useState, useEffect, useRef } from 'react';
import { BubbleColor, COLOR_PALETTE } from '../types';
import { BUBBLE_COLORS } from '../constants';
import { X, Check, Infinity as InfinityIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreate: (color: BubbleColor, size: number, text: string, isRitual: boolean) => void;
}

const CreateBubbleModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState<BubbleColor>('blue');
  const [priority, setPriority] = useState(3);
  const [isRitual, setIsRitual] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onCreate(selectedColor, isRitual ? 3 : priority, text, isRitual);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      <div className="md:hidden fixed inset-0 z-[119] bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center md:block">
        <div
          ref={containerRef}
          className="
            bg-slate-900 border border-slate-800 rounded-[24px] md:rounded-[28px] overflow-hidden
            shadow-[0_32px_80px_-16px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-6 fade-in duration-300 pointer-events-auto
            w-[90%] max-w-[320px] mx-4
            md:absolute md:bottom-[88px] md:right-[16px] md:w-[288px] md:mx-0
          "
        >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">New Bubble</h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input 
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bubble title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm font-medium shadow-inner"
          />

          <div className="flex justify-between gap-1.5">
            {BUBBLE_COLORS.map(color => {
              const palette = COLOR_PALETTE[color];
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center
                    ${palette.bg} ${palette.border}
                    ${isSelected ? 'scale-110 ring-2 ring-white/20 border-white/50 shadow-lg' : 'hover:scale-105 opacity-60'}
                  `}
                >
                  {isSelected && <Check size={14} className={palette.text} />}
                </button>
              );
            })}
          </div>

          {!isRitual && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`flex-1 h-11 rounded-xl border transition-all flex items-center justify-center
                      ${priority === lvl 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-md scale-105' 
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800'}
                    `}
                  >
                    <div className="rounded-full bg-current" style={{ width: 4 + lvl * 2, height: 4 + lvl * 2 }} />
                  </button>
                ))}
              </div>
              <div className="flex justify-between px-1 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          )}

          <button 
            type="button"
            onClick={() => setIsRitual(!isRitual)}
            className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest
              ${isRitual ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}
            `}
          >
            <InfinityIcon size={16} />
            {isRitual ? 'Persistent Active' : 'Persistent Bubbl'}
          </button>

          <button 
            type="submit"
            disabled={!text.trim()}
            className="w-full py-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
          >
            Spawn Bubble
          </button>
        </form>
      </div>
    </div>
    </>
  );
};

export default CreateBubbleModal;
