'use client';

import { UpdateItem, UpdateCategory, Priority } from '@/lib/types';
import { Pin, ExternalLink, Clock, User, Calendar } from 'lucide-react';

interface UpdateCardProps {
  update: UpdateItem;
  onClick: () => void;
}

const CATEGORY_STYLES: Record<UpdateCategory, { bg: string; text: string; border: string }> = {
  'Announcement': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Protocol': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Incident': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Reminder': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'FYI': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Staffing/OOO': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  'Noise': { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

const PRIORITY_STYLES: Record<Priority, { dot: string; text: string }> = {
  'High': { dot: 'bg-red-500', text: 'text-red-700' },
  'Med': { dot: 'bg-amber-500', text: 'text-amber-700' },
  'Low': { dot: 'bg-slate-400', text: 'text-slate-600' },
};

export default function UpdateCard({ update, onClick }: UpdateCardProps) {
  const categoryStyle = CATEGORY_STYLES[update.category];
  const priorityStyle = PRIORITY_STYLES[update.priority];
  
  const hasChannelMention = update.mentions.some(
    m => m === '@channel' || m === '@here' || m === '@everyone'
  );

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all
                  hover:shadow-md hover:border-surface-300
                  ${categoryStyle.bg} ${categoryStyle.border}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category badge */}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full 
                           ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
            {update.category}
          </span>
          
          {/* Priority indicator */}
          <span className={`flex items-center gap-1 text-xs font-medium ${priorityStyle.text}`}>
            <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
            {update.priority}
          </span>
          
          {/* Pinned indicator */}
          {update.is_pinned && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Pin className="w-3 h-3" />
              Pinned
            </span>
          )}
          
          {/* Channel mention indicator */}
          {hasChannelMention && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded">
              @channel
            </span>
          )}
        </div>
        
        {/* Links indicator */}
        {update.links.length > 0 && (
          <ExternalLink className="w-4 h-4 text-surface-400 flex-shrink-0" />
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-surface-900 mb-1 line-clamp-2">
        {update.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-surface-600 mb-3 line-clamp-2">
        {update.summary}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs text-surface-500">
        <div className="flex items-center gap-3">
          {update.owner && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {update.owner}
            </span>
          )}
          {update.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(update.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {update.timestamp_text && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {update.timestamp_text}
            </span>
          )}
        </div>
        
        {/* Tags preview */}
        {update.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {update.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-white/50 rounded text-surface-600"
              >
                {tag}
              </span>
            ))}
            {update.tags.length > 2 && (
              <span className="text-surface-400">+{update.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

