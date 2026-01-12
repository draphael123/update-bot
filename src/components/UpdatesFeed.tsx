'use client';

import { useState, useMemo } from 'react';
import { UpdateItem, FilterState } from '@/lib/types';
import { sortUpdates, getAllTags, getAllAuthors } from '@/lib/classifier';
import FilterBar from './FilterBar';
import UpdateCard from './UpdateCard';
import DetailPanel from './DetailPanel';
import { ListFilter, AlertCircle } from 'lucide-react';

interface UpdatesFeedProps {
  updates: UpdateItem[];
}

export default function UpdatesFeed({ updates }: UpdatesFeedProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priorities: [],
    tags: [],
    authors: [],
    onlyMentions: false,
    searchQuery: '',
  });

  const availableTags = useMemo(() => getAllTags(updates), [updates]);
  const availableAuthors = useMemo(() => getAllAuthors(updates), [updates]);

  // Apply filters
  const filteredUpdates = useMemo(() => {
    let result = updates;

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter(u => filters.categories.includes(u.category));
    }

    // Filter by priorities
    if (filters.priorities.length > 0) {
      result = result.filter(u => filters.priorities.includes(u.priority));
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter(u => 
        filters.tags.some(tag => u.tags.includes(tag))
      );
    }

    // Filter by authors
    if (filters.authors.length > 0) {
      result = result.filter(u => 
        u.owner && filters.authors.includes(u.owner)
      );
    }

    // Filter by mentions
    if (filters.onlyMentions) {
      result = result.filter(u => 
        u.mentions.some(m => 
          m === '@channel' || m === '@here' || m === '@everyone'
        )
      );
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(u =>
        u.title.toLowerCase().includes(query) ||
        u.summary.toLowerCase().includes(query) ||
        u.details.toLowerCase().includes(query)
      );
    }

    return sortUpdates(result);
  }, [updates, filters]);

  // Stats
  const stats = useMemo(() => {
    const total = updates.length;
    const high = updates.filter(u => u.priority === 'High').length;
    const noise = updates.filter(u => u.category === 'Noise').length;
    return { total, high, noise, displayed: filteredUpdates.length };
  }, [updates, filteredUpdates]);

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-500">
        <AlertCircle className="w-12 h-12 mb-3 text-surface-300" />
        <p className="text-lg font-medium">No updates yet</p>
        <p className="text-sm">Paste Slack messages and click Parse to get started</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-surface-600">
            <strong>{stats.displayed}</strong> of {stats.total} updates
          </span>
          {stats.high > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {stats.high} High Priority
            </span>
          )}
          {stats.noise > 0 && (
            <span className="text-surface-400">
              {stats.noise} noise filtered
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg 
                     transition-colors
                     ${showFilters 
                       ? 'bg-primary-100 text-primary-700' 
                       : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
        >
          <ListFilter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Filters sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 overflow-y-auto">
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={availableTags}
              availableAuthors={availableAuthors}
            />
          </div>
        )}

        {/* Updates list */}
        <div className="flex-1 overflow-y-auto pr-2">
          {filteredUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-surface-500">
              <p className="font-medium">No updates match your filters</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUpdates.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  onClick={() => setSelectedUpdate(update)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel overlay */}
      {selectedUpdate && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedUpdate(null)}
          />
          <DetailPanel
            update={selectedUpdate}
            onClose={() => setSelectedUpdate(null)}
          />
        </>
      )}
    </div>
  );
}

