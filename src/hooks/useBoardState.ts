import { useReducer, useEffect, useCallback } from 'react';
import { BoardState, Card, Column, TagId } from '../types/board';
import { boardReducer, DEFAULT_STATE } from '../utils/boardReducer';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'kanban-board-state';

/**
 * Pure function used as the useReducer lazy initializer.
 * Receives `read` as the initialArg and returns the merged BoardState.
 */
function initBoardState(read: () => BoardState): BoardState {
  const saved = read();
  return {
    ...DEFAULT_STATE,
    ...saved,
    // Always reset transient filter on page load
    filter: { searchText: '', activeTag: null },
  };
}

export function useBoardState() {
  const { read, write } = useLocalStorage<BoardState>(STORAGE_KEY, DEFAULT_STATE);

  // useReducer 3-arg form: init(read) is called once to produce initial state
  const [state, dispatch] = useReducer(boardReducer, read, initBoardState);

  // Persist state on every change
  useEffect(() => {
    write(state);
  }, [state, write]);

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Derived: cards filtered by search + tag
  const filteredCardIds = useCallback(
    (columnId: string): string[] => {
      const col = state.columns.find(c => c.id === columnId);
      if (!col) return [];
      const { searchText, activeTag } = state.filter;
      const lower = searchText.toLowerCase();

      return col.cardIds.filter(id => {
        const card: Card | undefined = state.cards[id];
        if (!card) return false;
        if (activeTag && card.tag !== activeTag) return false;
        if (
          lower &&
          !card.title.toLowerCase().includes(lower) &&
          !card.description.toLowerCase().includes(lower)
        ) {
          return false;
        }
        return true;
      });
    },
    [state.columns, state.cards, state.filter]
  );

  const isFiltering =
    state.filter.searchText.trim().length > 0 || state.filter.activeTag !== null;

  const actions = {
    addCard: (columnId: string, card: Card) =>
      dispatch({ type: 'ADD_CARD', columnId, card }),

    editCard: (card: Card) => dispatch({ type: 'EDIT_CARD', card }),

    deleteCard: (cardId: string, columnId: string) =>
      dispatch({ type: 'DELETE_CARD', cardId, columnId }),

    moveCard: (
      cardId: string,
      fromColumnId: string,
      toColumnId: string,
      toIndex: number
    ) => dispatch({ type: 'MOVE_CARD', cardId, fromColumnId, toColumnId, toIndex }),

    addColumn: (column: Column) =>
      dispatch({ type: 'ADD_COLUMN', column }),

    deleteColumn: (columnId: string) => dispatch({ type: 'DELETE_COLUMN', columnId }),

    renameColumn: (columnId: string, title: string) =>
      dispatch({ type: 'RENAME_COLUMN', columnId, title }),

    moveColumn: (fromIndex: number, toIndex: number) =>
      dispatch({ type: 'MOVE_COLUMN', fromIndex, toIndex }),

    setSearchText: (searchText: string) =>
      dispatch({ type: 'SET_FILTER', filter: { searchText } }),

    setActiveTag: (activeTag: TagId | null) =>
      dispatch({ type: 'SET_FILTER', filter: { activeTag } }),

    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),

    resetBoard: () => dispatch({ type: 'RESET_BOARD' }),
  };

  return { state, actions, filteredCardIds, isFiltering };
}
