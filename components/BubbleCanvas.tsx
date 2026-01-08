
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Bubble, BubbleColor, COLOR_PALETTE, SIZES, SortMode } from '../types';
import { Trash2, CheckCircle, Circle, X, Infinity as InfinityIcon } from 'lucide-react';
import { BUBBLE_COLORS } from '../constants';

interface Props {
  bubbles: Bubble[];
  onUpdate: (bubbles: Bubble[]) => void;
  onTogglePersistent: (id: string) => void;
  focusedColor: BubbleColor | null;
  onUpdateBubble: (id: string, updates: Partial<Bubble>) => void;
  onDeleteBubble: (id: string) => void;
  sortMode: SortMode;
}

const EXPANDED_WIDTH = 320;
const MIN_EXPANDED_HEIGHT = 440;

// Custom easing for a smoother, premium feel
const SMOOTH_EASING = 'cubic-bezier(0.19, 1, 0.22, 1)';

const BubbleCanvas: React.FC<Props> = ({ 
  bubbles, 
  onUpdate, 
  onTogglePersistent, 
  focusedColor,
  onUpdateBubble,
  onDeleteBubble,
  sortMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined>>(null);
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const [anchorPos, setAnchorPos] = useState<{ x: number, y: number } | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const expandedIdRef = useRef<string | null>(null);
  const sortModeRef = useRef<SortMode>(sortMode);

  useEffect(() => { expandedIdRef.current = expandedId; }, [expandedId]);
  useEffect(() => { sortModeRef.current = sortMode; }, [sortMode]);

  const getExpandedDimensions = (bubble: Bubble) => {
    const textLen = bubble.text.length;
    const descLen = (bubble.description || '').length;
    const titleRows = Math.ceil(textLen / 20);
    const descRows = Math.max(3, Math.ceil(descLen / 35));
    const height = 180 + (titleRows * 26) + (descRows * 20);
    return { width: EXPANDED_WIDTH, height: Math.max(MIN_EXPANDED_HEIGHT, Math.min(height, 620)) };
  };

  // 1. Initial Simulation Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const sim = d3.forceSimulation([])
      .alphaMin(0.001)
      .velocityDecay(0.4)
      .alphaDecay(0.06)
      .force('charge', d3.forceManyBody().strength(0))
      .force('collision', d3.forceCollide()
        .radius((d: any) => expandedIdRef.current === d.id ? 0 : SIZES[d.size - 1] + 2)
        .strength(1)
      )
      .force('bound', () => {
        const nodes = sim.nodes();
        nodes.forEach((node: any) => {
          const isExpanded = expandedIdRef.current === node.id;
          const dims = isExpanded ? getExpandedDimensions(node as Bubble) : { width: SIZES[node.size - 1] * 2, height: SIZES[node.size - 1] * 2 };
          const rX = dims.width / 2;
          const rY = dims.height / 2;
          const p = 15;
          if (node.x < rX + p) { node.x = rX + p; node.vx = 0; }
          if (node.x > width - rX - p) { node.x = width - rX - p; node.vx = 0; }
          if (node.y < rY + p) { node.y = rY + p; node.vy = 0; }
          if (node.y > height - rY - p) { node.y = height - rY - p; node.vy = 0; }
        });
      });

    sim.on('tick', () => {
      const nodes = sim.nodes();
      nodes.forEach((node: any) => {
        const el = bubbleRefs.current.get(node.id);
        if (el) {
          const isExpanded = expandedIdRef.current === node.id;
          const { width: w, height: h } = isExpanded ? getExpandedDimensions(node as Bubble) : { width: SIZES[node.size - 1] * 2, height: SIZES[node.size - 1] * 2 };
          el.style.transform = `translate3d(${node.x - w/2}px, ${node.y - h/2}px, 0)`;
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
        }
      });
    });

    (simulationRef as any).current = sim;
    return () => sim.stop();
  }, []);

  // 2. Sync Bubbles and Handle Drag Binding
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;

    const currentNodes = sim.nodes();
    const nextNodes = bubbles.map(b => {
      const existing = currentNodes.find(n => n.id === b.id);
      if (existing) {
        Object.assign(existing, b);
        return existing;
      }
      return { ...b };
    });

    sim.nodes(nextNodes);

    bubbles.forEach(bubble => {
      const el = bubbleRefs.current.get(bubble.id);
      if (!el) return;

      const drag = d3.drag<HTMLDivElement, any>()
        .on('start', (event) => {
          if (expandedIdRef.current) return;
          // Lower alpha target for smoother dragging
          sim.alphaTarget(0.15).restart();
          setIsDraggingId(bubble.id);
          const node = sim.nodes().find(n => n.id === bubble.id);
          if (node) {
            node.fx = node.x;
            node.fy = node.y;
          }
        })
        .on('drag', (event) => {
          if (expandedIdRef.current) return;
          const node = sim.nodes().find(n => n.id === bubble.id);
          if (node) {
            node.fx = event.x;
            node.fy = event.y;
          }
        })
        .on('end', (event) => {
          if (expandedIdRef.current) return;
          sim.alphaTarget(0);
          setIsDraggingId(null);
          const node = sim.nodes().find(n => n.id === bubble.id);
          if (node) {
            node.fx = null;
            node.fy = null;
            if (sortModeRef.current === 'none') {
              onUpdate(sim.nodes() as any);
            } else {
              sim.alpha(0.3).restart();
            }
          }
        });

      d3.select(el).call(drag as any);
    });

    sim.alpha(0.2).restart();
  }, [bubbles]);

  // 3. Force Logic
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim || !containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const cX = w / 2;
    const cY = h / 2;

    sim.force('sortX', null);
    sim.force('sortY', null);

    if (sortMode !== 'none') {
      // Increase decay slightly in sorted mode to dampen erratic movement
      sim.velocityDecay(0.5);
      sim.force('charge', d3.forceManyBody().strength(-15).distanceMax(100)); // Lowered strength
      sim.force('collision', d3.forceCollide().radius((d: any) => expandedIdRef.current === d.id ? 0 : SIZES[d.size - 1] + 6).strength(1));

      if (sortMode === 'color') {
        const offset = Math.min(w, h) * 0.12;
        const targets: Record<string, { x: number, y: number }> = {
          blue:   { x: cX - offset, y: cY - offset },
          green:  { x: cX + offset, y: cY - offset },
          yellow: { x: cX,          y: cY },
          purple: { x: cX - offset, y: cY + offset },
          red:    { x: cX + offset, y: cY + offset }
        };
        // Lower strength (0.8 vs 1.8) makes them drift calmly rather than snap
        sim.force('sortX', d3.forceX((d: any) => targets[d.color].x).strength(0.8));
        sim.force('sortY', d3.forceY((d: any) => targets[d.color].y).strength(0.8));
      } else if (sortMode === 'priority') {
        const laneW = 55;
        sim.force('sortX', d3.forceX((d: any) => cX + (3 - d.size) * laneW).strength(1.2));
        sim.force('sortY', d3.forceY((d: any) => cY + (Math.sin(d.id.length) * 15)).strength(0.5));
      }
      // Lower alpha (0.4 vs 1.0) prevents the "kick" when sorting starts
      sim.alpha(0.4).restart();
    } else {
      sim.velocityDecay(0.4);
      sim.force('charge', d3.forceManyBody().strength(0));
      sim.force('collision', d3.forceCollide().radius((d: any) => expandedIdRef.current === d.id ? 0 : SIZES[d.size - 1] + 2).strength(1));
      sim.alpha(0.2).restart();
    }
  }, [sortMode, expandedId]);

  const handleToggleExpand = (bubbleId: string) => {
    const sim = simulationRef.current;
    if (!sim) return;

    setAnimatingId(bubbleId);
    
    if (expandedId === bubbleId) {
      const node = sim.nodes().find(n => n.id === bubbleId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      setExpandedId(null);
      setAnchorPos(null);
      sim.alpha(0.1).restart(); // Very gentle restart when closing
    } else {
      const node = sim.nodes().find(n => n.id === bubbleId);
      if (node) {
        node.fx = node.x;
        node.fy = node.y;
      }
      setExpandedId(bubbleId);
      setAnchorPos(node ? { x: node.x, y: node.y } : null);
    }
  };

  const handleBackgroundClick = () => {
    if (expandedId) {
      handleToggleExpand(expandedId);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] cursor-default"
      onClick={handleBackgroundClick}
    >
      {bubbles.map((bubble) => {
        const palette = COLOR_PALETTE[bubble.color];
        const isExpanded = expandedId === bubble.id;
        const radius = SIZES[bubble.size - 1];
        const isDimmed = focusedColor && focusedColor !== bubble.color;
        const isDragging = isDraggingId === bubble.id;
        const isAnimating = animatingId === bubble.id;

        const auraColor = bubble.color === 'blue' ? 'rgba(59, 130, 246, 0.4)' : 
                          bubble.color === 'green' ? 'rgba(16, 185, 129, 0.4)' : 
                          bubble.color === 'yellow' ? 'rgba(245, 158, 11, 0.4)' : 
                          bubble.color === 'purple' ? 'rgba(168, 85, 247, 0.4)' : 
                          'rgba(244, 63, 94, 0.4)';

        return (
          <div
            key={bubble.id}
            ref={(el) => { if (el) bubbleRefs.current.set(bubble.id, el); else bubbleRefs.current.delete(bubble.id); }}
            className={`absolute flex items-center justify-center border-2 select-none group will-change-transform
              ${palette.bg} ${palette.border} ${isDimmed && !isExpanded ? 'opacity-5 pointer-events-none' : 'opacity-100'}
              ${isDragging ? 'ring-2 ring-white/20 z-[100] scale-110 shadow-2xl transition-none' : ''}
              ${isExpanded ? 'ring-2 ring-white/20 z-[200] cursor-default scale-100' : 'hover:scale-105 cursor-grab active:cursor-grabbing shadow-none z-10'}
              transition-[background-color,border-color,opacity,ring,border-radius,transform,box-shadow,width,height] 
              ${isExpanded ? `bg-slate-950/90 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_60px_${auraColor}]` : 'backdrop-blur-[4px] shadow-none'}
            `}
            style={{
              borderRadius: isExpanded ? '32px' : '50%',
              borderWidth: isExpanded ? '2px' : '2px',
              borderColor: isExpanded ? auraColor : undefined,
              transitionDuration: isExpanded ? '200ms' : '150ms',
              transitionTimingFunction: SMOOTH_EASING,
              left: 0, top: 0,
            }}
            onDoubleClick={(e) => { e.stopPropagation(); handleToggleExpand(bubble.id); }}
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={() => setAnimatingId(null)}
          >
            <div className={`flex flex-col items-center justify-center text-center w-full h-full relative overflow-hidden box-border transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              
              {/* --- DIALOGUE / EXPANDED VIEW --- */}
              <div className={`flex flex-col gap-4 w-full h-full p-6 pointer-events-auto overflow-hidden justify-between transition-all absolute inset-0 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                   onMouseDown={(e) => e.stopPropagation()}
                   style={{ transitionTimingFunction: SMOOTH_EASING, transitionDuration: '200ms' }}>
                <div className="flex flex-col gap-2 text-left flex-grow">
                  <div className="flex justify-between items-start">
                    <input className={`bg-transparent text-xl font-bold w-full focus:outline-none py-0.5 border-b border-white/0 focus:border-white/20 transition-colors ${palette.text}`}
                      value={bubble.text} onChange={(e) => onUpdateBubble(bubble.id, { text: e.target.value })} placeholder="Title..." />
                    <button onClick={(e) => { e.stopPropagation(); handleToggleExpand(bubble.id); }}
                      className="text-slate-500 hover:text-white transition-colors ml-2 p-1 rounded-full hover:bg-slate-800"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <textarea className={`bg-slate-950/50 border border-slate-800/80 rounded-[20px] p-4 text-sm leading-snug text-slate-100 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all mt-1 flex-grow shadow-inner font-inter`}
                    placeholder="Describe your thoughts..." value={bubble.description || ''}
                    onChange={(e) => onUpdateBubble(bubble.id, { description: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-3 mt-auto">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">Sphere Impact</span>
                      <div className="flex justify-between items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => onUpdateBubble(bubble.id, { size: s })}
                                  className={`flex-1 h-10 rounded-xl border transition-all flex items-center justify-center ${bubble.size === s ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow-xl shadow-indigo-500/50' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-300'}`}>
                            <div className="rounded-full bg-current" style={{ width: 4 + s * 1.5, height: 4 + s * 1.5 }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">Sphere Aura</span>
                      <div className="flex justify-between items-center gap-2">
                        {BUBBLE_COLORS.map(c => (
                          <button key={c} onClick={() => onUpdateBubble(bubble.id, { color: c })}
                                  className={`flex-1 h-10 rounded-xl border transition-all flex items-center justify-center ${bubble.color === c ? 'ring-2 ring-white border-transparent scale-105 shadow-xl' : 'border-white/5 opacity-40 hover:opacity-100'} ${COLOR_PALETTE[c].bg.replace('/10', '/50')}`}>
                            <div className={`w-4 h-4 rounded-full ${COLOR_PALETTE[c].bg.replace('/10', '')}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                    <button onClick={() => onDeleteBubble(bubble.id)}
                            className="w-fit px-4 py-2.5 text-rose-500 hover:text-rose-400 transition-all hover:bg-rose-500/10 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] border border-rose-500/20"
                    >
                      <Trash2 size={14} /> Delete Bubble
                    </button>
                  </div>
                </div>
              </div>

              {/* --- COMPACT VIEW --- */}
              <div className={`flex flex-col items-center justify-start w-full h-full relative overflow-hidden transition-all duration-150 ${isExpanded ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="h-[38%] w-full flex flex-col items-center justify-end px-5 pb-1 relative z-10 overflow-hidden">
                  <span className={`font-bold leading-[1.1] break-words select-none w-full text-center transition-all ${palette.text}`}
                        style={{ fontSize: Math.max(radius * 0.22, 11), maxWidth: '85%', maxHeight: '100%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {bubble.text}
                  </span>
                </div>
                <div className="w-[45%] h-[1px] bg-white/10 shrink-0 rounded-full relative z-10" />
                <div className="h-[62%] w-full flex flex-col items-center justify-start overflow-hidden pt-1.5 pb-4 px-5 relative z-10">
                  {bubble.description && (
                    <div className="w-full flex-1 overflow-hidden pointer-events-none mb-1 max-w-[90%] relative">
                       <p className="text-slate-200 opacity-60 italic select-none w-full text-center leading-[1.2] tracking-normal break-words"
                          style={{ 
                            fontSize: Math.max(radius * 0.11, 7.5), 
                            display: '-webkit-box', 
                            WebkitLineClamp: bubble.size <= 2 ? 1 : 5, 
                            WebkitBoxOrient: 'vertical',
                            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                          }}>
                        {bubble.description}
                       </p>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-center gap-2">
                    {(bubble.isPersistent || bubble.isRitual) && (
                      <button onClick={(e) => { e.stopPropagation(); onTogglePersistent(bubble.id); }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className={`transition-all hover:scale-125 ${palette.text} pointer-events-auto`}>
                        {bubble.isRitual ? (
                           <InfinityIcon size={Math.min(radius * 0.45, 30)} className={bubble.isCompleted ? 'opacity-30 scale-75' : 'opacity-100'} />
                        ) : (
                          bubble.isCompleted ? <CheckCircle size={Math.min(radius * 0.45, 26)} className="opacity-40" /> : <Circle size={Math.min(radius * 0.45, 26)} className="opacity-80" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BubbleCanvas;
