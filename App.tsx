
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Workspace, Bubble, BubbleColor, SortMode } from './types';
import { INITIAL_WORKSPACES, BUBBLE_COLORS } from './constants';
import BubbleCanvas from './components/BubbleCanvas';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GalleryView from './components/GalleryView';
import CreateBubbleModal from './components/CreateBubbleModal';

const MAX_PRESSURE_POINTS = 75; // 15 bubbles of size 5 = 75 points
const RITUAL_RESET_MS = 30 * 60 * 1000; // 30 minutes

const playPopSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(1, audioCtx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};

const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0].id);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [focusedColor, setFocusedColor] = useState<BubbleColor | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('none');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [colorLabels, setColorLabels] = useState<Record<string, Record<BubbleColor, string>>>({
    'ws-1': { blue: 'Daily', green: 'Relax', yellow: 'Idea', purple: 'Vision', red: 'Urgent' },
    'ws-2': { blue: 'Email', green: 'Meetings', yellow: 'Research', purple: 'Code', red: 'Deadline' },
    'ws-3': { blue: 'Health', green: 'Fitness', yellow: 'Hobbies', purple: 'Home', red: 'Urgent' },
  });

  const activeWorkspace = useMemo(() => 
    workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0],
    [workspaces, activeWorkspaceId]
  );

  const calculatePressure = (bubbles: Bubble[]) => {
    const totalPoints = bubbles.reduce((sum, b) => sum + b.size, 0);
    return Math.min(Math.round((totalPoints / MAX_PRESSURE_POINTS) * 100), 100);
  };

  const activePressure = useMemo(() => calculatePressure(activeWorkspace.bubbles), [activeWorkspace]);

  // Ritual bubble reset check
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        bubbles: ws.bubbles.map(b => {
          if (b.isRitual && b.isCompleted && b.lastShrunkAt && Date.now() - b.lastShrunkAt > RITUAL_RESET_MS) {
            return { ...b, isCompleted: false, size: 3, lastShrunkAt: undefined };
          }
          return b;
        })
      })));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const updateBubbles = useCallback((bubbles: Bubble[]) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspaceId ? { ...ws, bubbles: [...bubbles] } : ws
    ));
  }, [activeWorkspaceId]);

  const addBubble = (color: BubbleColor, size: number, text: string = 'New Task', isRitual: boolean = false) => {
    if (activePressure >= 100) return;

    const spawnX = window.innerWidth / 3;
    const spawnY = window.innerHeight / 2;

    const newBubble: Bubble = {
      id: `b-${Date.now()}`,
      text,
      description: '',
      color,
      size,
      isRitual,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
    };
    updateBubbles([...activeWorkspace.bubbles, newBubble]);
    setIsCreateModalOpen(false);
  };

  const toggleSortByColor = () => {
    setSortMode(prev => prev === 'color' ? 'none' : 'color');
  };

  const toggleSortByPriority = () => {
    setSortMode(prev => prev === 'priority' ? 'none' : 'priority');
  };

  const togglePersistent = (id: string) => {
    const bubble = activeWorkspace.bubbles.find(b => b.id === id);
    if (!bubble) return;

    if (bubble.isRitual) {
      updateBubbles(activeWorkspace.bubbles.map(b => {
        if (b.id === id) {
          const newState = !b.isCompleted;
          if (newState) playPopSound();
          return { 
            ...b, 
            isCompleted: newState, 
            size: newState ? 1 : 3, 
            lastShrunkAt: newState ? Date.now() : undefined 
          };
        }
        return b;
      }));
    } else {
      updateBubbles(activeWorkspace.bubbles.map(b => {
        if (b.id === id && b.isPersistent) {
          const newState = !b.isCompleted;
          if (newState) playPopSound();
          return { ...b, isCompleted: newState, size: newState ? 1 : 3 };
        }
        return b;
      }));
    }
  };

  const handleWorkspaceNameChange = (id: string, name: string) => {
    setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name } : ws));
  };

  const handleLabelChange = (color: BubbleColor, text: string) => {
    setColorLabels(prev => ({
      ...prev,
      [activeWorkspaceId]: {
        ...prev[activeWorkspaceId],
        [color]: text
      }
    }));
  };

  const updateBubble = (id: string, updates: Partial<Bubble>) => {
    if (updates.size) {
      const currentPoints = activeWorkspace.bubbles.reduce((sum, b) => sum + b.size, 0);
      const bubble = activeWorkspace.bubbles.find(b => id === b.id);
      const diff = updates.size - (bubble?.size || 0);
      if (currentPoints + diff > MAX_PRESSURE_POINTS) return;
    }
    updateBubbles(activeWorkspace.bubbles.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBubble = (id: string) => {
    playPopSound();
    updateBubbles(activeWorkspace.bubbles.filter(b => b.id !== id));
  };

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden flex flex-col font-inter">
      <Header
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        onWorkspaceNameChange={handleWorkspaceNameChange}
        pressure={activePressure}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden p-2 md:p-3 gap-0 md:gap-3">
        <main className="relative flex-1 bg-slate-900 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-700 rounded-[20px] md:rounded-[32px] border border-slate-800">
          <BubbleCanvas
            bubbles={activeWorkspace.bubbles}
            onUpdate={updateBubbles}
            onTogglePersistent={togglePersistent}
            focusedColor={focusedColor}
            onUpdateBubble={updateBubble}
            onDeleteBubble={deleteBubble}
            sortMode={sortMode}
          />

          {isGalleryOpen && (
            <GalleryView
              workspaces={workspaces.map(ws => ({ ...ws, pressure: calculatePressure(ws.bubbles) }))}
              onClose={() => setIsGalleryOpen(false)}
              onSelect={(id) => {
                setActiveWorkspaceId(id);
                setIsGalleryOpen(false);
              }}
            />
          )}
        </main>

        <Sidebar
          bubbles={activeWorkspace.bubbles}
          onAddBubble={(color, size, isRitual) => addBubble(color, size, 'New Task', isRitual)}
          onSortByColor={toggleSortByColor}
          onSortByPriority={toggleSortByPriority}
          sortMode={sortMode}
          colorLabels={colorLabels[activeWorkspaceId]}
          onLabelChange={handleLabelChange}
          focusedColor={focusedColor}
          onSetFocusedColor={setFocusedColor}
          onOpenGallery={() => setIsGalleryOpen(true)}
          isGalleryOpen={isGalleryOpen}
          onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          activePressure={activePressure}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {isCreateModalOpen && !isGalleryOpen && (
        <CreateBubbleModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={addBubble}
        />
      )}
    </div>
  );
};

export default App;
