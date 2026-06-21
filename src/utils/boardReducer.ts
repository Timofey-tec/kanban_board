import { BoardState, BoardAction, Column } from '../types/board';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeDemoState(): BoardState {
  const now = new Date().toISOString();
  const r = () => Math.random().toString(36).slice(2, 7);
  const ts = Date.now();

  const todoId = `col-${ts}-${r()}`;
  const inProgId = `col-${ts}-${r()}`;
  const doneId = `col-${ts}-${r()}`;
  const c1 = `card-${ts}-${r()}`;
  const c2 = `card-${ts}-${r()}`;
  const c3 = `card-${ts}-${r()}`;
  const c4 = `card-${ts}-${r()}`;
  const c5 = `card-${ts}-${r()}`;

  return {
    columns: [
      { id: todoId, title: 'To Do', cardIds: [c1, c2, c3] },
      { id: inProgId, title: 'In Progress', cardIds: [c4] },
      { id: doneId, title: 'Done', cardIds: [c5] },
    ],
    cards: {
      [c1]: {
        id: c1,
        title: '👋 Перетащи эту карточку в другую колонку',
        description: "Зажми и перетащи меня в 'In Progress', чтобы увидеть как это работает",
        tag: null,
        createdAt: now,
      },
      [c2]: {
        id: c2,
        title: 'Добавь свою первую задачу',
        description: "Нажми кнопку '+ Добавить задачу' внизу любой колонки",
        tag: 'feature',
        createdAt: now,
      },
      [c3]: {
        id: c3,
        title: 'Пример обычной задачи',
        description: 'Здесь может быть описание любой твоей задачи',
        tag: 'bug',
        createdAt: now,
      },
      [c4]: {
        id: c4,
        title: 'Можно редактировать карточки',
        description: 'Нажми на эту карточку, чтобы открыть и изменить её',
        tag: 'urgent',
        createdAt: now,
      },
      [c5]: {
        id: c5,
        title: 'Так выглядит выполненная задача',
        description: 'Перетаскивай сюда то, что уже готово',
        tag: null,
        createdAt: now,
      },
    },
    filter: { searchText: '', activeTag: null },
    theme: 'light',
  };
}

export const DEFAULT_STATE: BoardState = makeDemoState();

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'ADD_CARD': {
      const columnExists = state.columns.some(c => c.id === action.columnId);
      if (!columnExists) return state;
      return {
        ...state,
        columns: state.columns.map(col =>
          col.id === action.columnId
            ? { ...col, cardIds: [...col.cardIds, action.card.id] }
            : col
        ),
        cards: { ...state.cards, [action.card.id]: action.card },
      };
    }

    case 'EDIT_CARD': {
      if (!state.cards[action.card.id]) return state;
      return {
        ...state,
        cards: { ...state.cards, [action.card.id]: action.card },
      };
    }

    case 'DELETE_CARD': {
      const newCards = { ...state.cards };
      delete newCards[action.cardId];
      return {
        ...state,
        columns: state.columns.map(col =>
          col.id === action.columnId
            ? { ...col, cardIds: col.cardIds.filter(id => id !== action.cardId) }
            : col
        ),
        cards: newCards,
      };
    }

    case 'MOVE_CARD': {
      const { cardId, fromColumnId, toColumnId, toIndex } = action;

      if (fromColumnId === toColumnId) {
        // Reorder within the same column
        const col = state.columns.find(c => c.id === fromColumnId);
        if (!col) return state;
        const ids = col.cardIds.filter(id => id !== cardId);
        const clampedIndex = Math.min(toIndex, ids.length);
        ids.splice(clampedIndex, 0, cardId);
        return {
          ...state,
          columns: state.columns.map(c =>
            c.id === fromColumnId ? { ...c, cardIds: ids } : c
          ),
        };
      }

      // Move between columns
      const fromIds = state.columns
        .find(c => c.id === fromColumnId)
        ?.cardIds.filter(id => id !== cardId) ?? [];
      const toIds = [...(state.columns.find(c => c.id === toColumnId)?.cardIds ?? [])];
      const clampedIndex = Math.min(toIndex, toIds.length);
      toIds.splice(clampedIndex, 0, cardId);

      return {
        ...state,
        columns: state.columns.map(col => {
          if (col.id === fromColumnId) return { ...col, cardIds: fromIds };
          if (col.id === toColumnId) return { ...col, cardIds: toIds };
          return col;
        }),
      };
    }

    case 'ADD_COLUMN': {
      return {
        ...state,
        columns: [...state.columns, action.column],
      };
    }

    case 'DELETE_COLUMN': {
      const col = state.columns.find(c => c.id === action.columnId);
      if (!col) return state;
      const newCards = { ...state.cards };
      col.cardIds.forEach(id => delete newCards[id]);
      return {
        ...state,
        columns: state.columns.filter(c => c.id !== action.columnId),
        cards: newCards,
      };
    }

    case 'RENAME_COLUMN': {
      return {
        ...state,
        columns: state.columns.map(col =>
          col.id === action.columnId ? { ...col, title: action.title } : col
        ),
      };
    }

    case 'MOVE_COLUMN': {
      const cols = [...state.columns];
      const [moved] = cols.splice(action.fromIndex, 1);
      if (!moved) return state;
      cols.splice(action.toIndex, 0, moved);
      return { ...state, columns: cols };
    }

    case 'SET_FILTER': {
      return {
        ...state,
        filter: { ...state.filter, ...action.filter },
      };
    }

    case 'TOGGLE_THEME': {
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };
    }

    case 'RESET_BOARD': {
      return { ...makeDemoState(), theme: state.theme };
    }

    default:
      return state;
  }
}

export function createColumn(title: string): Column {
  return {
    id: `col-${generateId()}`,
    title: title.trim(),
    cardIds: [],
  };
}
