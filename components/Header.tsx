
import React, { useRef, useState } from 'react';
import { Workspace } from '../types';
import { Cloud, Edit2, Check } from 'lucide-react';

interface Props {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  onWorkspaceNameChange: (id: string, name: string) => void;
  pressure: number;
}

const Header: React.FC<Props> = ({ 
  workspaces, 
  activeWorkspaceId, 
  setActiveWorkspaceId, 
  onWorkspaceNameChange,
  pressure
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const startEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingId(id);
    setTimeout(() => {
      inputRefs.current[id]?.focus();
      inputRefs.current[id]?.select();
    }, 50);
  };

  const finishEditing = () => {
    setEditingId(null);
  };

  return (
    <header className="h-16 bg-slate-950 flex items-center justify-between px-6 z-10 border-b border-slate-900 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-500 p-2 rounded-full text-white shadow-lg shadow-indigo-500/20">
          <Cloud size={24} />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">BubblBrain</h1>
      </div>

      <nav className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 ml-4">
        {workspaces.map((ws) => {
          const isActive = activeWorkspaceId === ws.id;
          const isEditing = editingId === ws.id;

          return (
            <div 
              key={ws.id}
              onClick={() => !isEditing && setActiveWorkspaceId(ws.id)}
              className={`px-4 py-1.5 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-2 group relative overflow-hidden h-10
                ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
              `}
            >
              {isEditing ? (
                <input 
                  ref={(el) => inputRefs.current[ws.id] = el}
                  value={ws.name}
                  onChange={(e) => onWorkspaceNameChange(ws.id, e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                  className="bg-transparent border-none focus:outline-none font-bold w-24 md:w-32 text-center text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-bold w-24 md:w-32 text-center truncate">{ws.name}</span>
              )}
              
              <button 
                onClick={(e) => isEditing ? finishEditing() : startEditing(e, ws.id)}
                className={`p-1 rounded-md transition-opacity duration-200 
                  ${isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-40 hover:opacity-100'}`}
              >
                {isEditing ? <Check size={14} /> : <Edit2 size={12} />}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase leading-none">Pressure</span>
            <span className={`text-xs font-bold leading-none mt-1 ${pressure >= 100 ? 'text-rose-400' : 'text-slate-200'}`}>
              {pressure}%
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-700 ${pressure > 90 ? 'bg-rose-500' : pressure > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${pressure}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
