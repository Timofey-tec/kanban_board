import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Column } from './Column';
import { Card as CardComponent } from './Card';
import { AddColumnButton } from './AddColumnButton';
import { CardModal } from '../CardModal/CardModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Card, TAGS, TagId } from '../../types/board';
import { useBoardState } from '../../hooks/useBoardState';
import { createColumn } from '../../utils/boardReducer';

function generateCardId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function Board() {
  const { state, actions, filteredCardIds, isFiltering } = useBoardState();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);

  // Delete card confirmation state
  const [deleteCardConfirm, setDeleteCardConfirm] = useState<{
    cardId: string;
    columnId: string;
    title: string;
  } | null>(null);

  // Reset board confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // DnD active IDs
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Find which column a card belongs to
  const findColumnOfCard = useCallback(
    (cardId: string): string | undefined =>
      state.columns.find(col => col.cardIds.includes(cardId))?.id,
    [state.columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { type: 'card' | 'column' } | undefined;
    if (data?.type === 'card') {
      setActiveCardId(active.id as string);
    } else if (data?.type === 'column') {
      setActiveColumnId(active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { type: 'card' | 'column' } | undefined;
    if (activeData?.type !== 'card') return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromColId = findColumnOfCard(activeId);
    if (!fromColId) return;

    // Over a column directly
    const overIsColumn = state.columns.some(c => c.id === overId);
    const toColId = overIsColumn ? overId : findColumnOfCard(overId);
    if (!toColId || fromColId === toColId) return;

    // Move card to end of target column immediately for live preview
    const toCol = state.columns.find(c => c.id === toColId);
    if (!toCol) return;
    actions.moveCard(activeId, fromColId, toColId, toCol.cardIds.length);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeData = active.data.current as { type: 'card' | 'column' } | undefined;
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeData?.type === 'column') {
      const fromIndex = state.columns.findIndex(c => c.id === activeId);
      const toIndex = state.columns.findIndex(c => c.id === overId);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        actions.moveColumn(fromIndex, toIndex);
      }
      return;
    }

    if (activeData?.type === 'card') {
      const fromColId = findColumnOfCard(activeId);
      if (!fromColId) return;

      const overIsColumn = state.columns.some(c => c.id === overId);

      if (overIsColumn) {
        // Dropped on a column itself → place at end
        const toCol = state.columns.find(c => c.id === overId);
        if (!toCol) return;
        actions.moveCard(activeId, fromColId, overId, toCol.cardIds.length);
      } else {
        // Dropped on another card
        const toColId = findColumnOfCard(overId);
        if (!toColId) return;
        const toCol = state.columns.find(c => c.id === toColId);
        if (!toCol) return;
        const toIndex = toCol.cardIds.indexOf(overId);
        if (fromColId === toColId) {
          // Reorder within same column
          const fromIndex = toCol.cardIds.indexOf(activeId);
          if (fromIndex === toIndex) return;
          const newIds = arrayMove(toCol.cardIds, fromIndex, toIndex);
          const currentIndex = newIds.indexOf(activeId);
          actions.moveCard(activeId, fromColId, toColId, currentIndex);
        } else {
          actions.moveCard(
            activeId,
            fromColId,
            toColId,
            toIndex === -1 ? 0 : toIndex
          );
        }
      }
    }
  };

  const openAddCardModal = (columnId: string) => {
    setEditingCard(null);
    setTargetColumnId(columnId);
    setModalOpen(true);
  };

  const openEditCardModal = (card: Card) => {
    setEditingCard(card);
    setTargetColumnId(null);
    setModalOpen(true);
  };

  const handleModalSave = (
    data: Omit<Card, 'id' | 'createdAt'> & Partial<Pick<Card, 'id' | 'createdAt'>>
  ) => {
    if (data.id) {
      // Edit existing
      actions.editCard({
        id: data.id,
        title: data.title,
        description: data.description,
        tag: data.tag,
        createdAt: data.createdAt ?? new Date().toISOString(),
      });
    } else if (targetColumnId) {
      // Add new
      actions.addCard(targetColumnId, {
        id: generateCardId(),
        title: data.title,
        description: data.description,
        tag: data.tag,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteCardRequest = (card: Card) => {
    const colId = findColumnOfCard(card.id);
    if (!colId) return;
    setDeleteCardConfirm({ cardId: card.id, columnId: colId, title: card.title });
  };

  const activeCard = activeCardId ? state.cards[activeCardId] : null;
  const activeColumn = activeColumnId
    ? state.columns.find(c => c.id === activeColumnId)
    : null;

  const tagList = Object.values(TAGS);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* ── Top bar ── */}
      <header className="flex-shrink-0 px-6 py-4 flex flex-wrap items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mr-2">
          Kanban Board
        </h1>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={state.filter.searchText}
            onChange={e => actions.setSearchText(e.target.value)}
            placeholder="Search cards..."
            className="pl-9 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          {state.filter.searchText && (
            <button
              onClick={() => actions.setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => actions.setActiveTag(null)}
            className={[
              'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
              state.filter.activeTag === null
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400',
            ].join(' ')}
          >
            All
          </button>
          {tagList.map(tag => (
            <button
              key={tag.id}
              onClick={() =>
                actions.setActiveTag(
                  state.filter.activeTag === tag.id ? null : (tag.id as TagId)
                )
              }
              className={[
                'px-2.5 py-1 text-xs font-medium rounded-full border-2 transition-all',
                state.filter.activeTag === tag.id
                  ? `${tag.color} text-white border-transparent`
                  : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 hover:border-gray-400',
              ].join(' ')}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Reset board */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-colors"
          >
            Reset Board
          </button>

          {/* Theme toggle */}
          <button
            onClick={actions.toggleTheme}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={
              state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {state.theme === 'dark' ? (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Board area ── */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.columns.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 p-6 items-start min-w-max">
              {state.columns.map(col => {
                const visibleCards = filteredCardIds(col.id)
                  .map(id => state.cards[id])
                  .filter((c): c is Card => Boolean(c));

                return (
                  <Column
                    key={col.id}
                    column={col}
                    cards={visibleCards}
                    allCardIds={col.cardIds}
                    isFiltering={isFiltering}
                    onAddCard={() => openAddCardModal(col.id)}
                    onCardClick={openEditCardModal}
                    onDeleteColumn={() => actions.deleteColumn(col.id)}
                    onRenameColumn={title => actions.renameColumn(col.id, title)}
                  />
                );
              })}

              <AddColumnButton
                onAdd={title => actions.addColumn(createColumn(title))}
              />
            </div>
          </SortableContext>

          {/* Drag overlay for visual feedback */}
          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="opacity-95 rotate-1 shadow-2xl">
                <CardComponent
                  card={activeCard}
                  onClick={() => {}}
                />
              </div>
            )}
            {activeColumn && (
              <div className="opacity-90 rotate-1 shadow-2xl w-72 bg-gray-100 dark:bg-gray-800 rounded-2xl p-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-1">
                  {activeColumn.title}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Card modal ── */}
      <CardModal
        isOpen={modalOpen}
        card={editingCard}
        onSave={handleModalSave}
        onClose={() => {
          setModalOpen(false);
          setEditingCard(null);
        }}
        onDelete={
          editingCard
            ? () => handleDeleteCardRequest(editingCard)
            : undefined
        }
      />

      {/* ── Delete card confirmation ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteCardConfirm)}
        title="Delete Card"
        message={`Are you sure you want to delete "${deleteCardConfirm?.title ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteCardConfirm) {
            actions.deleteCard(deleteCardConfirm.cardId, deleteCardConfirm.columnId);
          }
          setDeleteCardConfirm(null);
        }}
        onCancel={() => setDeleteCardConfirm(null)}
      />

      {/* ── Reset board confirmation ── */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Board"
        message="Вернуть доску к примеру по умолчанию? Все твои текущие задачи будут удалены."
        confirmLabel="Reset to Demo"
        danger
        onConfirm={() => {
          actions.resetBoard();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
