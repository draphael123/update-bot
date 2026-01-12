'use client';

import { useState } from 'react';
import { UpdateItem, DocumentTemplate } from '@/lib/types';
import { 
  generateMarkdown, 
  generateDocx, 
  downloadFile, 
  downloadMarkdown,
  copyToClipboard,
} from '@/lib/docx-generator';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Calendar,
  FileType,
  AlertCircle,
} from 'lucide-react';

interface DocumentGeneratorProps {
  updates: UpdateItem[];
}

const TEMPLATES: DocumentTemplate[] = [
  'Daily IC Update',
  'Weekly IC Summary',
  'Leadership Digest',
];

export default function DocumentGenerator({ updates }: DocumentGeneratorProps) {
  const [template, setTemplate] = useState<DocumentTemplate>('Daily IC Update');
  const [date, setDate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string>('');

  // Filter out noise for document generation
  const relevantUpdates = updates.filter(u => u.category !== 'Noise');

  const handleGeneratePreview = () => {
    const md = generateMarkdown(relevantUpdates, template, date || undefined);
    setPreview(md);
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown(relevantUpdates, template, date || undefined);
    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(relevantUpdates, template, date || undefined);
    const filename = `${template.toLowerCase().replace(/\s+/g, '-')}-${date || new Date().toISOString().split('T')[0]}.md`;
    downloadMarkdown(md, filename);
  };

  const handleDownloadDocx = async () => {
    setGenerating(true);
    try {
      const blob = await generateDocx(relevantUpdates, template, date || undefined);
      const filename = `${template.toLowerCase().replace(/\s+/g, '-')}-${date || new Date().toISOString().split('T')[0]}.docx`;
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Failed to generate DOCX:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-500">
        <FileText className="w-12 h-12 mb-3 text-surface-300" />
        <p className="text-lg font-medium">No updates to generate document</p>
        <p className="text-sm">Paste Slack messages and click Parse first</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Card */}
      <div className="p-6 bg-white border border-surface-200 rounded-lg">
        <h3 className="font-semibold text-surface-900 mb-4">Document Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value as DocumentTemplate);
                setPreview('');
              }}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Document Date (optional)
              </span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPreview('');
              }}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-surface-600">
          <span>
            <strong>{relevantUpdates.length}</strong> updates will be included
          </span>
          {updates.length !== relevantUpdates.length && (
            <span className="text-surface-400">
              ({updates.length - relevantUpdates.length} noise items excluded)
            </span>
          )}
        </div>
      </div>

      {/* Actions Card */}
      <div className="p-6 bg-white border border-surface-200 rounded-lg">
        <h3 className="font-semibold text-surface-900 mb-4">Generate & Export</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGeneratePreview}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 
                     hover:bg-surface-200 text-surface-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Preview Markdown
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 
                     hover:bg-surface-200 text-surface-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Markdown
              </>
            )}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 
                     hover:bg-surface-200 text-surface-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download .md
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 
                     hover:bg-primary-700 disabled:bg-primary-400
                     text-white rounded-lg transition-colors"
          >
            <FileType className="w-4 h-4" />
            {generating ? 'Generating...' : 'Download .docx'}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      {preview && (
        <div className="p-6 bg-white border border-surface-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Markdown Preview</h3>
            <button
              onClick={() => setPreview('')}
              className="text-sm text-surface-500 hover:text-surface-700"
            >
              Hide
            </button>
          </div>
          <pre className="p-4 bg-surface-50 rounded-lg border border-surface-200 
                        text-sm font-mono text-surface-700 whitespace-pre-wrap 
                        overflow-x-auto max-h-96">
            {preview}
          </pre>
        </div>
      )}

      {/* Content Preview */}
      <div className="p-6 bg-white border border-surface-200 rounded-lg">
        <h3 className="font-semibold text-surface-900 mb-4">Content Preview</h3>
        
        {relevantUpdates.length === 0 ? (
          <div className="flex items-center gap-2 text-surface-500">
            <AlertCircle className="w-4 h-4" />
            No significant updates to include
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group by priority */}
            {['High', 'Med', 'Low'].map((priority) => {
              const items = relevantUpdates.filter(u => u.priority === priority);
              if (items.length === 0) return null;
              
              return (
                <div key={priority}>
                  <h4 className="text-sm font-medium text-surface-600 mb-2">
                    {priority} Priority ({items.length})
                  </h4>
                  <ul className="space-y-1 ml-4">
                    {items.map((item) => (
                      <li key={item.id} className="text-sm text-surface-700">
                        <span className="font-medium">{item.title}</span>
                        {item.owner && (
                          <span className="text-surface-400"> — {item.owner}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

