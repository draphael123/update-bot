'use client';

import { UpdateItem, UpdateCategory, Priority } from '@/lib/types';
import { X, Pin, ExternalLink, Clock, User, Copy, Check, Tag } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/docx-generator';

interface DetailPanelProps {
  update: UpdateItem | null;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<UpdateCategory, { bg: string; text: string }> = {
  'Announcement': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Protocol': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Incident': { bg: 'bg-red-100', text: 'text-red-800' },
  'Reminder': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'FYI': { bg: 'bg-green-100', text: 'text-green-800' },
  'Staffing/OOO': { bg: 'bg-slate-100', text: 'text-slate-800' },
  'Noise': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  'High': { bg: 'bg-red-100', text: 'text-red-800' },
  'Med': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'Low': { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export default function DetailPanel({ update, onClose }: DetailPanelProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedDetails, setCopiedDetails] = useState(false);

  if (!update) return null;

  const categoryStyle = CATEGORY_STYLES[update.category];
  const priorityStyle = PRIORITY_STYLES[update.priority];
  
  const hasChannelMention = update.mentions.some(
    m => m === '@channel' || m === '@here' || m === '@everyone'
  );

  const handleCopyLink = async (link: string) => {
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleCopyDetails = async () => {
    const success = await copyToClipboard(update.details);
    if (success) {
      setCopiedDetails(true);
      setTimeout(() => setCopiedDetails(false), 2000);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[480px] bg-white shadow-xl 
                    border-l border-surface-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200">
        <h2 className="font-semibold text-surface-900">Update Details</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5 text-surface-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
            {update.category}
          </span>
          <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
            {update.priority} Priority
          </span>
          {update.is_pinned && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium 
                           bg-amber-100 text-amber-800 rounded-full">
              <Pin className="w-3 h-3" />
              Pinned
            </span>
          )}
          {hasChannelMention && (
            <span className="px-2.5 py-1 text-sm font-medium bg-blue-600 text-white rounded-full">
              @channel
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-1">
            {update.title}
          </h3>
          <p className="text-surface-600">{update.summary}</p>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-surface-500">
          {update.owner && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {update.owner}
            </span>
          )}
          {update.timestamp_text && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {update.timestamp_text}
            </span>
          )}
        </div>

        {/* Full details */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-surface-700">Full Message</h4>
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700"
            >
              {copiedDetails ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
            <p className="text-sm text-surface-700 whitespace-pre-wrap">
              {update.details}
            </p>
          </div>
        </div>

        {/* Links */}
        {update.links.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-surface-700 mb-2 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              Links
            </h4>
            <div className="space-y-2">
              {update.links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-surface-50 rounded border border-surface-200"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary-600 hover:text-primary-700 
                             truncate hover:underline"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => handleCopyLink(link)}
                    className="p-1 rounded hover:bg-surface-200 text-surface-500"
                  >
                    {copiedLink === link ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {update.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-surface-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {update.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-sm bg-primary-50 text-primary-700 
                           rounded-full border border-primary-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mentions */}
        {update.mentions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-surface-700 mb-2">Mentions</h4>
            <div className="flex flex-wrap gap-2">
              {update.mentions.map((mention, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-sm bg-blue-50 text-blue-700 
                           rounded-full border border-blue-200"
                >
                  {mention}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

