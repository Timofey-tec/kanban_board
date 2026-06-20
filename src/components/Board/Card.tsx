import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, TAGS } from '../../types/board';

interface CardProps {
  card: CardType;
  onClick: () => void;
}

export function Card({ card, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tag = card.tag ? TAGS[card.tag] : null;

  const formattedDate = new Date(card.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={[
        'group relative bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600',
        'px-3.5 py-3 cursor-grab active:cursor-grabbing select-none',
        'hover:shadow-md hover:border-gray-200 dark:hover:border-gray-500',
        'transition-all duration-150',
        isDragging ? 'opacity-40 shadow-xl scale-[1.02] ring-2 ring-indigo-400' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {/* Drag handle strip */}
      <div
        {...listeners}
        className="absolute left-0 top-0 h-full w-4 flex items-center justify-center rounded-l-xl opacity-20 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        onClick={e => e.stopPropagation()}
        aria-label="Drag card"
      >
        <svg className="w-3 h-3 text-gray-300 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-6 6a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      </div>

      {/* Tag badge */}
      {tag && (
        <div className="flex mb-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full text-white ${tag.color}`}
          >
            {tag.label}
          </span>
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug line-clamp-3 break-words">
        {card.title}
      </p>

      {/* Description preview */}
      {card.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 break-words">
          {card.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formattedDate}</span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          click to edit
        </span>
      </div>
    </div>
  );
}
