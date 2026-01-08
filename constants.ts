
import { Workspace, BubbleColor } from './types';

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Main Space',
    bubbles: [
      { id: 'p-1', text: 'My Daily Core', color: 'blue', size: 3, isPersistent: true, isCompleted: false, x: 400, y: 300, vx: 0, vy: 0 },
      { id: 'b-1', text: 'Read a book', color: 'green', size: 2, x: 200, y: 150, vx: 0, vy: 0 },
      { id: 'b-2', text: 'Finish Project', color: 'red', size: 5, x: 600, y: 400, vx: 0, vy: 0 }
    ]
  },
  {
    id: 'ws-2',
    name: 'Work',
    bubbles: [
      { id: 'p-2', text: 'Professional Goal', color: 'purple', size: 3, isPersistent: true, isCompleted: false, x: 400, y: 300, vx: 0, vy: 0 },
      { id: 'b-3', text: 'Email Team', color: 'blue', size: 1, x: 300, y: 200, vx: 0, vy: 0 }
    ]
  },
  {
    id: 'ws-3',
    name: 'Personal',
    bubbles: [
      { id: 'p-3', text: 'Self Improvement', color: 'yellow', size: 3, isPersistent: true, isCompleted: false, x: 400, y: 300, vx: 0, vy: 0 }
    ]
  }
];

export const BUBBLE_COLORS: BubbleColor[] = ['blue', 'green', 'yellow', 'purple', 'red'];
