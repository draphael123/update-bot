'use client';

import { UpdateCategory, Priority, FilterState } from '@/lib/types';
import { Search, X, Calendar } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTags: string[];
  availableAuthors: string[];
  availableDates: string[];
}

const CATEGORIES: UpdateCategory[] = [
  'Announcement',
  'Protocol',
  'Incident',
  'Reminder',
  'FYI',
  'Staffing/OOO',
  'Noise',
];

const PRIORITIES: Priority[] = ['High', 'Med', 'Low'];

const CATEGORY_COLORS: Record<UpdateCategory, string> = {
  'Announcement': 'bg-blue-100 text-blue-800 border-blue-200',
  'Protocol': 'bg-purple-100 text-purple-800 border-purple-200',
  'Incident': 'bg-red-100 text-red-800 border-red-200',
  'Reminder': 'bg-amber-100 text-amber-800 border-amber-200',
  'FYI': 'bg-green-100 text-green-800 border-green-200',
  'Staffing/OOO': 'bg-slate-100 text-slate-800 border-slate-200',
  'Noise': 'bg-gray-100 text-gray-500 border-gray-200',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  'High': 'bg-red-100 text-red-800 border-red-200',
  'Med': 'bg-amber-100 text-amber-800 border-amber-200',
  'Low': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function FilterBar({
  filters,
  onFiltersChange,
  availableTags,
  availableAuthors,
  availableDates,
}: FilterBarProps) {
  const toggleCategory = (category: UpdateCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const togglePriority = (priority: Priority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const toggleAuthor = (author: string) => {
    const newAuthors = filters.authors.includes(author)
      ? filters.authors.filter(a => a !== author)
      : [...filters.authors, author];
    onFiltersChange({ ...filters, authors: newAuthors });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      priorities: [],
      tags: [],
      authors: [],
      onlyMentions: false,
      searchQuery: '',
      dateFrom: null,
      dateTo: null,
    });
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tags.length > 0 ||
    filters.authors.length > 0 ||
    filters.onlyMentions ||
    filters.searchQuery.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null;
  
  // Format date for display
  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 p-4 bg-white border border-surface-200 rounded-lg">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search updates..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-surface-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Category Filters */}
      <div>
        <div className="text-xs font-medium text-surface-500 mb-2">Categories</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all
                ${filters.categories.includes(category) 
                  ? CATEGORY_COLORS[category] + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filters */}
      <div>
        <div className="text-xs font-medium text-surface-500 mb-2">Priority</div>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              onClick={() => togglePriority(priority)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all
                ${filters.priorities.includes(priority)
                  ? PRIORITY_COLORS[priority] + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Mentions Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyMentions}
            onChange={(e) => onFiltersChange({ ...filters, onlyMentions: e.target.checked })}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 
                       focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-surface-700">Only @channel/@here mentions</span>
        </label>
      </div>

      {/* Date Filter */}
      <div>
        <div className="text-xs font-medium text-surface-500 mb-2 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Date Range
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-surface-400 block mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
                className="w-full px-2 py-1.5 text-xs border border-surface-200 rounded
                         focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-surface-400 block mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
                className="w-full px-2 py-1.5 text-xs border border-surface-200 rounded
                         focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          {/* Quick date buttons */}
          {availableDates.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableDates.slice(0, 5).map((date) => (
                <button
                  key={date}
                  onClick={() => onFiltersChange({ ...filters, dateFrom: date, dateTo: date })}
                  className={`px-2 py-0.5 text-xs rounded border transition-all
                    ${filters.dateFrom === date && filters.dateTo === date
                      ? 'bg-primary-100 text-primary-800 border-primary-200'
                      : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                    }`}
                >
                  {formatDateDisplay(date)}
                </button>
              ))}
            </div>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => onFiltersChange({ ...filters, dateFrom: null, dateTo: null })}
              className="text-xs text-surface-500 hover:text-surface-700"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Tags Filter (if any) */}
      {availableTags.length > 0 && (
        <div>
          <div className="text-xs font-medium text-surface-500 mb-2">Tags</div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-xs rounded border transition-all
                  ${filters.tags.includes(tag)
                    ? 'bg-primary-100 text-primary-800 border-primary-200 ring-1 ring-primary-300'
                    : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Authors Filter (if any) */}
      {availableAuthors.length > 0 && (
        <div>
          <div className="text-xs font-medium text-surface-500 mb-2">Authors</div>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) toggleAuthor(e.target.value);
            }}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select author...</option>
            {availableAuthors.map((author) => (
              <option key={author} value={author}>
                {author} {filters.authors.includes(author) ? '✓' : ''}
              </option>
            ))}
          </select>
          {filters.authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.authors.map((author) => (
                <span
                  key={author}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs 
                             bg-primary-100 text-primary-800 rounded-full"
                >
                  {author}
                  <button
                    onClick={() => toggleAuthor(author)}
                    className="hover:text-primary-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      )}
    </div>
  );
}

