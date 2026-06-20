import { useState, useRef, useEffect } from 'react';

interface AddColumnButtonProps {
  onAdd: (title: string) => void;
}

export function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Column name cannot be empty.');
      return;
    }
    if (trimmed.length > 60) {
      setError('Column name must be 60 characters or fewer.');
      return;
    }
    onAdd(trimmed);
    setValue('');
    setError('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setValue('');
    setError('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex-shrink-0 w-72 h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add Column
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          placeholder="Column name..."
          maxLength={60}
          className={[
            'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700',
            'text-gray-900 dark:text-gray-100 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500',
            error
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600',
          ].join(' ')}
          onKeyDown={e => {
            if (e.key === 'Escape') handleCancel();
          }}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
