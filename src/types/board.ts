export type TagId = 'bug' | 'feature' | 'urgent' | 'design';

export interface Tag {
  id: TagId;
  label: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
}

export const TAGS: Record<TagId, Tag> = {
  bug: {
    id: 'bug',
    label: 'Bug',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  },
  feature: {
    id: 'feature',
    label: 'Feature',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  urgent: {
    id: 'urgent',
    label: 'Urgent',
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  design: {
    id: 'design',
    label: 'Design',
    color: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
};

export interface Card {
  id: string;
  title: string;
  description: string;
  tag: TagId | null;
  createdAt: string; // ISO string
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface BoardFilter {
  searchText: string;
  activeTag: TagId | null;
}

export interface BoardState {
  columns: Column[];
  cards: Record<string, Card>;
  filter: BoardFilter;
  theme: 'light' | 'dark';
}

// Union type for all reducer actions
export type BoardAction =
  | { type: 'ADD_CARD'; columnId: string; card: Card }
  | { type: 'EDIT_CARD'; card: Card }
  | { type: 'DELETE_CARD'; cardId: string; columnId: string }
  | { type: 'MOVE_CARD'; cardId: string; fromColumnId: string; toColumnId: string; toIndex: number }
  | { type: 'ADD_COLUMN'; column: Column }
  | { type: 'DELETE_COLUMN'; columnId: string }
  | { type: 'RENAME_COLUMN'; columnId: string; title: string }
  | { type: 'MOVE_COLUMN'; fromIndex: number; toIndex: number }
  | { type: 'SET_FILTER'; filter: Partial<BoardFilter> }
  | { type: 'TOGGLE_THEME' }
  | { type: 'RESET_BOARD' };
