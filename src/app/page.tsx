'use client';

import { useState, useEffect, useCallback } from 'react';
import { SlackMessage, UpdateItem } from '@/lib/types';
import { parseSlackText } from '@/lib/parser';
import { classifyMessages } from '@/lib/classifier';
import { loadState, saveState, clearState, exportStateAsJson, importStateFromJson } from '@/lib/storage';
import { downloadFile } from '@/lib/docx-generator';
import PasteInput from '@/components/PasteInput';
import UpdatesFeed from '@/components/UpdatesFeed';
import RawMessages from '@/components/RawMessages';
import DocumentGenerator from '@/components/DocumentGenerator';
import ShareUpdate from '@/components/ShareUpdate';
import { MessageSquare, FileText, Code, Zap, Share2 } from 'lucide-react';

type TabId = 'feed' | 'share' | 'raw' | 'document';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'feed', label: 'Updates Feed', icon: <Zap className="w-4 h-4" /> },
  { id: 'share', label: 'Share Update', icon: <Share2 className="w-4 h-4" /> },
  { id: 'document', label: 'Document Generator', icon: <FileText className="w-4 h-4" /> },
  { id: 'raw', label: 'Raw Messages', icon: <Code className="w-4 h-4" /> },
];

export default function Home() {
  const [rawText, setRawText] = useState('');
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Load state from localStorage on mount
  useEffect(() => {
    const state = loadState();
    setRawText(state.rawText);
    setMessages(state.messages);
    setUpdates(state.updates);
    setIsLoaded(true);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      saveState({
        rawText,
        messages,
        updates,
        lastParsed: updates.length > 0 ? new Date().toISOString() : null,
      });
    }
  }, [rawText, messages, updates, isLoaded]);

  const handleParse = useCallback(() => {
    const parsedMessages = parseSlackText(rawText);
    const classifiedUpdates = classifyMessages(parsedMessages, selectedDate);
    setMessages(parsedMessages);
    setUpdates(prev => {
      // Merge with existing updates (keep updates from other dates)
      const existingFromOtherDates = prev.filter(u => u.date !== selectedDate);
      return [...existingFromOtherDates, ...classifiedUpdates];
    });
    
    // Switch to feed tab after parsing
    if (classifiedUpdates.length > 0) {
      setActiveTab('feed');
    }
  }, [rawText, selectedDate]);

  const handleClear = useCallback(() => {
    setRawText('');
    setMessages([]);
    setUpdates([]);
    clearState();
  }, []);

  const handleExport = useCallback(() => {
    const json = exportStateAsJson(messages, updates);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `ic-updates-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(blob, filename);
  }, [messages, updates]);

  const handleImport = useCallback((jsonString: string) => {
    const result = importStateFromJson(jsonString);
    if (result) {
      setMessages(result.messages);
      setUpdates(result.updates);
      setActiveTab('feed');
    }
  }, []);

  // Prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse text-surface-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">IC Updates</h1>
              <p className="text-sm text-surface-500">
                Parse and organize Slack messages into structured updates
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 min-h-[calc(100vh-180px)]">
          {/* Left panel - Paste input */}
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-6 h-[calc(100vh-200px)] flex flex-col 
                          bg-white border border-surface-200 rounded-lg p-4">
              <PasteInput
                value={rawText}
                onChange={setRawText}
                onParse={handleParse}
                onClear={handleClear}
                onImport={handleImport}
                onExport={handleExport}
                hasData={messages.length > 0}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>

          {/* Right panel - Tabs and content */}
          <div className="flex-1 min-w-0">
            {/* Tab navigation */}
            <div className="bg-white border border-surface-200 rounded-t-lg border-b-0">
              <div className="flex gap-1 px-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium 
                              border-b-2 transition-colors
                              ${activeTab === tab.id
                                ? 'text-primary-600 border-primary-600'
                                : 'text-surface-600 border-transparent hover:text-surface-900'
                              }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.id === 'feed' && updates.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 
                                     text-primary-700 rounded-full">
                        {updates.filter(u => u.category !== 'Noise').length}
                      </span>
                    )}
                    {tab.id === 'share' && updates.filter(u => u.priority === 'High').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 
                                     text-red-700 rounded-full">
                        {updates.filter(u => u.priority === 'High').length}
                      </span>
                    )}
                    {tab.id === 'raw' && messages.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-surface-100 
                                     text-surface-600 rounded-full">
                        {messages.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white border border-surface-200 rounded-b-lg p-6 
                          min-h-[500px] overflow-hidden">
              {activeTab === 'feed' && <UpdatesFeed updates={updates} />}
              {activeTab === 'share' && <ShareUpdate updates={updates} />}
              {activeTab === 'document' && <DocumentGenerator updates={updates} />}
              {activeTab === 'raw' && <RawMessages messages={messages} />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-surface-500">
          IC Updates — Paste Slack messages to parse and organize team updates
        </div>
      </footer>
    </div>
  );
}

