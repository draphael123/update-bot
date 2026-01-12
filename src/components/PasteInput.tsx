'use client';

import { useState, useRef } from 'react';
import { Clipboard, Trash2, Upload, Download } from 'lucide-react';

interface PasteInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  onClear: () => void;
  onImport: (json: string) => void;
  onExport: () => void;
  hasData: boolean;
}

export default function PasteInput({
  value,
  onChange,
  onParse,
  onClear,
  onImport,
  onExport,
  hasData,
}: PasteInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      onChange(text);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        onImport(content);
      } else {
        onChange(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-surface-900">Paste Slack Messages</h2>
          <p className="text-xs text-surface-500">Mode: IC-team Slack</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm 
                     bg-surface-100 hover:bg-surface-200 text-surface-700 
                     rounded-lg transition-colors"
          >
            <Clipboard className="w-4 h-4" />
            Paste
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-surface-500 hover:text-surface-700 
                     hover:bg-surface-100 rounded transition-colors"
            title="Import file"
          >
            <Upload className="w-4 h-4" />
          </button>
          {hasData && (
            <button
              onClick={onExport}
              className="p-1.5 text-surface-500 hover:text-surface-700 
                       hover:bg-surface-100 rounded transition-colors"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Textarea */}
      <div
        className={`flex-1 relative border-2 rounded-lg transition-colors
                   ${isDragOver 
                     ? 'border-primary-500 bg-primary-50' 
                     : 'border-surface-200 bg-white'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste your Slack messages here...

Example format:
Jessica Booker
  11:13 AM
@channel Please remember to use the new protocol for LabCorp orders.

Lindsay Burden
  6:36 AM  replied to a thread:
Thanks, I'll update the macros.`}
          className="w-full h-full p-3 text-sm font-mono bg-transparent resize-none
                   focus:outline-none placeholder:text-surface-400"
        />
        
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center 
                         bg-primary-50/90 rounded-lg">
            <p className="text-primary-600 font-medium">Drop text here</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onParse}
          disabled={!value.trim()}
          className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 
                   disabled:bg-surface-300 disabled:cursor-not-allowed
                   text-white font-medium rounded-lg transition-colors"
        >
          Parse Messages
        </button>
        {(value || hasData) && (
          <button
            onClick={onClear}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats */}
      {value && (
        <div className="mt-2 text-xs text-surface-500">
          {value.split('\n').length} lines, {value.length} characters
        </div>
      )}
    </div>
  );
}

