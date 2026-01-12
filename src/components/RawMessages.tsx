'use client';

import { SlackMessage } from '@/lib/types';
import { User, Clock, Pin, MessageSquare, Link2, Paperclip, AtSign } from 'lucide-react';

interface RawMessagesProps {
  messages: SlackMessage[];
}

export default function RawMessages({ messages }: RawMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-500">
        <MessageSquare className="w-12 h-12 mb-3 text-surface-300" />
        <p className="text-lg font-medium">No messages parsed</p>
        <p className="text-sm">Paste Slack messages and click Parse</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-surface-600 mb-4">
        <strong>{messages.length}</strong> messages parsed
      </div>

      {messages.map((message, index) => (
        <div
          key={message.id}
          className="p-4 bg-white border border-surface-200 rounded-lg"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-surface-400">#{index + 1}</span>
              
              {message.author && (
                <span className="flex items-center gap-1.5 font-medium text-surface-900">
                  <User className="w-4 h-4 text-surface-400" />
                  {message.author}
                </span>
              )}
              
              {message.timestamp_text && (
                <span className="flex items-center gap-1 text-sm text-surface-500">
                  <Clock className="w-3.5 h-3.5" />
                  {message.timestamp_text}
                  {message.timestamp_minutes !== null && (
                    <span className="text-surface-400">
                      ({message.timestamp_minutes} min)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {message.is_pinned_context && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs 
                               bg-amber-100 text-amber-700 rounded">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
              {message.is_thread_reply && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  Thread Reply
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="mb-3">
            <pre className="text-sm text-surface-700 whitespace-pre-wrap font-sans">
              {message.body || <em className="text-surface-400">No body content</em>}
            </pre>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-surface-500 pt-3 border-t border-surface-100">
            {/* Mentions */}
            {message.mentions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" />
                <span>{message.mentions.join(', ')}</span>
              </div>
            )}

            {/* Links */}
            {message.links.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>{message.links.length} link(s)</span>
              </div>
            )}

            {/* Attachments */}
            {message.attachments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{message.attachments.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Raw block (collapsible) */}
          <details className="mt-3">
            <summary className="text-xs text-surface-400 cursor-pointer hover:text-surface-600">
              View raw block
            </summary>
            <pre className="mt-2 p-2 text-xs bg-surface-50 rounded border border-surface-200 
                          overflow-x-auto font-mono text-surface-600">
              {message.raw_block}
            </pre>
          </details>
        </div>
      ))}
    </div>
  );
}

