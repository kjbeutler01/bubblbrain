
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Workspace, Bubble, BubbleColor, COLOR_PALETTE, SIZES } from '../types';

interface MiniPreviewProps {
  bubbles: Bubble[];
  width: number;
  height: number;
}

const MiniPreview: React.FC<MiniPreviewProps> = ({ bubbles, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scaleFactor = 0.3;
    
    const simulation = d3.forceSimulation(bubbles as any)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('collide', d3.forceCollide().radius((d: any) => {
        const radius = SIZES[d.size - 1] * scaleFactor;
        return radius + 2;
      }).strength(1.0))
      .alpha(1.0)
      .alphaDecay(0.1);

    const nodes = containerRef.current.children;

    simulation.on('tick', () => {
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const el = nodes[i] as HTMLElement;
        if (el) {
          const radius = SIZES[b.size - 1] * scaleFactor;
          el.style.left = `${(b as any).x - radius}px`;
          el.style.top = `${(b as any).y - radius}px`;
        }
      }
    });

    return () => simulation.stop();
  }, [bubbles, width, height]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {bubbles.map((b) => {
        const radius = SIZES[b.size - 1] * 0.3;
        return (
          <div
            key={b.id}
            className={`absolute rounded-full border border-white/5 ${COLOR_PALETTE[b.color].bg}`}
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
            }}
          />
        );
      })}
    </div>
  );
};

interface Props {
  workspaces: (Workspace & { pressure?: number })[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

const GalleryView: React.FC<Props> = ({ workspaces, onClose, onSelect }) => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col p-4 md:p-12 bg-slate-950 animate-in fade-in duration-300">
      <div className="flex-1 flex items-center justify-center md:justify-center gap-6 md:gap-10 overflow-x-auto pb-4 md:pb-6 snap-x snap-mandatory md:snap-none">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => onSelect(ws.id)}
            className="flex flex-col group cursor-pointer w-[160px] md:w-[200px] h-[320px] md:h-[400px] shrink-0 snap-center"
          >
            <div className="flex-1 bg-slate-900/30 rounded-[24px] md:rounded-[32px] border-none relative overflow-hidden transition-all duration-300 group-hover:bg-slate-800/50 group-hover:scale-[1.02] shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                <div className="w-full h-full relative rounded-[20px] md:rounded-[24px] overflow-hidden bg-slate-950/40 border-none">
                  <MiniPreview
                    bubbles={ws.bubbles.map(b => ({ ...b }))}
                    width={window.innerWidth < 768 ? 120 : 150}
                    height={window.innerWidth < 768 ? 220 : 280}
                  />
                </div>
              </div>

              <div className="absolute bottom-4 md:bottom-6 inset-x-0 px-3 md:px-4 z-20">
                <h3 className="font-bold text-base md:text-lg text-white group-hover:text-indigo-400 transition-colors truncate text-center">
                  {ws.name}
                </h3>
                <div className="flex justify-center mt-1">
                   <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ws.pressure && ws.pressure > 90 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-950/50 text-slate-500'}`}>
                    Pressure {ws.pressure || 0}%
                   </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-16 md:h-20 flex items-center justify-center">
        <button
          onClick={onClose}
          className="px-6 md:px-8 py-2.5 md:py-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-slate-700 transition-all"
        >
          Close Gallery
        </button>
      </div>
    </div>
  );
};

export default GalleryView;
