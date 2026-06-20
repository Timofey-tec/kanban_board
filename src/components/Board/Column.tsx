import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, Card as CardType } from '../../types/board';
import { Card } from './Card';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  allCardIds: string[];
  isFiltering: boolean;
  onAddCard: () => void;
  onCardClick: (card: CardType) => void;
  onDeleteColumn: () => void;
  onRenameColumn: (title: string) => void;
}

interface ColumnInnerProps extends ColumnProps {
  dragHandleListeners: DraggableSyntheticListeners;
  dragHandleAttributes: DraggableAttributes;
  isDragging: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
}

function ColumnInner({
  column,
  cards,
  allCardIds,
  isFiltering,
  onAddCard,
  onCardClick,
  onDeleteColumn,
  onRenameColumn,
  dragHandleListeners,
  dragHandleAttributes,
  isDragging,
  setNodeRef: setColumnRef,
  style: columnStyle,
}: ColumnInnerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed.length <= 60) {
      onRenameColumn(trimmed);
    } else {
      setEditValue(column.title);
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    if (allCardIds.length > 0) {
      setShowDeleteConfirm(true);
    } else {
      onDeleteColumn();
    }
  };

  // Combine refs for droppable + sortable
  const setRef = (node: HTMLElement | null) => {
    setColumnRef(node);
    setDropRef(node);
  };

  return (
    <>
      <div
        ref={setRef}
        style={columnStyle}
        className={[
          'flex-shrink-0 w-72 flex flex-col rounded-2xl',
          'bg-gray-100 dark:bg-gray-800/70',
          'transition-all duration-150',
          isDragging ? 'opacity-50 shadow-2xl scale-[1.02] ring-2 ring-indigo-400' : '',
          isOver && !isDragging ? 'ring-2 ring-indigo-300 dark:ring-indigo-500' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Column header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 select-none">
          {/* Drag handle */}
          <button
            {...dragHandleListeners}
            {...dragHandleAttributes}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors flex-shrink-0"
            aria-label="Drag column"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-6 6a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </button>

          {/* Title / inline edit */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setEditValue(column.title);
                  setIsEditing(false);
                }
              }}
              maxLength={60}
              className="flex-1 min-w-0 px-1.5 py-0.5 text-sm font-semibold rounded border border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <button
              className="flex-1 min-w-0 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {column.title}
            </button>
          )}

          {/* Card count badge */}
          <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {isFiltering ? cards.length : allCardIds.length}
          </span>

          {/* Delete column */}
          <button
            onClick={handleDeleteClick}
            className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5 rounded"
            aria-label="Delete column"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Cards container */}
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto min-h-[60px] max-h-[calc(100vh-280px)]">
            {cards.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-400 dark:text-gray-500 text-center px-2">
                  {isFiltering ? 'No matching cards' : 'Перетащи сюда задачу или добавь новую'}
                </span>
              </div>
            )}
            {cards.map(card => (
              <div key={card.id} className="relative">
                <Card
                  card={card}
                  onClick={() => onCardClick(card)}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Add card button */}
        {!isFiltering && (
          <div className="px-2 pb-2">
            <button
              onClick={onAddCard}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-150 text-sm font-medium"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Confirmation dialog for deleting column with cards */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Column"
        message={`"${column.title}" has ${allCardIds.length} card${allCardIds.length !== 1 ? 's' : ''}. Deleting this column will permanently remove all its cards.`}
        confirmLabel="Delete Column"
        danger
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteColumn();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

export function Column(props: ColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.column.id, data: { type: 'column' } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ColumnInner
      {...props}
      dragHandleListeners={listeners}
      dragHandleAttributes={attributes}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={style}
    />
  );
}
