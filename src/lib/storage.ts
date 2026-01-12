import { SlackMessage, UpdateItem, StorageState } from './types';

const STORAGE_KEY = 'ic-updates-state';

/**
 * Get the default empty state
 */
export function getDefaultState(): StorageState {
  return {
    rawText: '',
    messages: [],
    updates: [],
    lastParsed: null,
  };
}

/**
 * Load state from localStorage
 */
export function loadState(): StorageState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultState();
    }
    
    const parsed = JSON.parse(stored);
    return {
      rawText: parsed.rawText || '',
      messages: parsed.messages || [],
      updates: parsed.updates || [],
      lastParsed: parsed.lastParsed || null,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return getDefaultState();
  }
}

/**
 * Save state to localStorage
 */
export function saveState(state: StorageState): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

/**
 * Clear stored state
 */
export function clearState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

/**
 * Export state as JSON string (for download)
 */
export function exportStateAsJson(
  messages: SlackMessage[], 
  updates: UpdateItem[]
): string {
  const exportData = {
    exported_at: new Date().toISOString(),
    messages,
    updates,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import state from JSON string
 */
export function importStateFromJson(jsonString: string): {
  messages: SlackMessage[];
  updates: UpdateItem[];
} | null {
  try {
    const data = JSON.parse(jsonString);
    return {
      messages: data.messages || [],
      updates: data.updates || [],
    };
  } catch (error) {
    console.error('Failed to parse imported JSON:', error);
    return null;
  }
}

