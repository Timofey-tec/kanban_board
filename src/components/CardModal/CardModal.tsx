import { useEffect, useRef, useState } from 'react';
import { Card, TagId } from '../../types/board';
import { Button } from '../shared/Button';
import { TagSelector } from './TagSelector';

interface CardModalProps {
  isOpen: boolean;
  card?: Card | null; // null/undefined = create mode
  onSave: (card: Omit<Card, 'id' | 'createdAt'> & Partial<Pick<Card, 'id' | 'createdAt'>>) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function CardModal({ isOpen, card, onSave, onClose, onDelete }: CardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<TagId | null>(null);
  const [titleError, setTitleError] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(card);

  // Sync form when card changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(card?.title ?? '');
      setDescription(card?.description ?? '');
      setTag(card?.tag ?? null);
      setTitleError('');
    }
  }, [isOpen, card]);

  // Auto-focus title field
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required.');
      titleRef.current?.focus();
      return;
    }
    if (trimmed.length > 120) {
      setTitleError('Title must be 120 characters or fewer.');
      titleRef.current?.focus();
      return;
    }
    onSave({ id: card?.id, createdAt: card?.createdAt, title: trimmed, description: description.trim(), tag });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2
            id="card-modal-title"
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            {isEditing ? 'Edit Card' : 'New Card'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <label
                htmlFor="card-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                id="card-title"
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                maxLength={120}
                placeholder="What needs to be done?"
                className={[
                  'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  titleError
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600',
                ].join(' ')}
                aria-describedby={titleError ? 'card-title-error' : undefined}
                aria-invalid={Boolean(titleError)}
              />
              {titleError && (
                <p
                  id="card-title-error"
                  className="mt-1 text-xs text-red-500 dark:text-red-400"
                  role="alert"
                >
                  {titleError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400 text-right">
                {title.length}/120
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="card-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Description{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="card-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Add more details..."
                className={[
                  'w-full px-3 py-2 text-sm rounded-lg border resize-y transition-colors',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                  'border-gray-300 dark:border-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                ].join(' ')}
              />
            </div>

            {/* Tag */}
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Label
              </p>
              <TagSelector value={tag} onChange={setTag} />
            </div>

            {/* Created date (edit mode only) */}
            {isEditing && card?.createdAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Created{' '}
                {new Date(card.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div>
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                >
                  Delete Card
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {isEditing ? 'Save Changes' : 'Add Card'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
