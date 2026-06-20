import { TAGS, TagId } from '../../types/board';

interface TagSelectorProps {
  value: TagId | null;
  onChange: (tag: TagId | null) => void;
}

const tagList = Object.values(TAGS);

export function TagSelector({ value, onChange }: TagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* None option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={[
          'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
          value === null
            ? 'bg-gray-200 border-gray-400 text-gray-800 dark:bg-gray-600 dark:border-gray-400 dark:text-gray-100'
            : 'border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500',
        ].join(' ')}
      >
        None
      </button>

      {tagList.map(tag => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onChange(tag.id)}
          className={[
            'px-3 py-1 text-xs font-medium rounded-full border-2 transition-all',
            value === tag.id
              ? `${tag.color} text-white border-transparent scale-105 shadow-sm`
              : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500',
          ].join(' ')}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
