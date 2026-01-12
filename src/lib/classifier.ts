import { SlackMessage, UpdateItem, UpdateCategory, Priority } from './types';

// Controlled vocabulary for tags
const TAG_KEYWORDS: Record<string, string[]> = {
  'LabCorp': ['labcorp', 'lab corp'],
  'Quest': ['quest'],
  'Akute': ['akute'],
  'Intercom': ['intercom'],
  'Scheduling': ['scheduling', 'schedule', 'appointment', 'appointments'],
  'Macros': ['macro', 'macros'],
  'Employment Verification': ['employment verification', 'employment verif'],
  'HRT Intake': ['hrt intake', 'hrt'],
  'Routing': ['routing', 'route', 'routed'],
  'HIPAA': ['hipaa'],
  'Subscription': ['subscription', 'subscriptions'],
  'Video Visit': ['video visit', 'video visits', 'telehealth'],
  'Tech Issue': ['tech issue', 'technical issue', 'error', 'bug', 'down'],
  'Protocol': ['protocol', 'protocols'],
  'Billing': ['billing', 'payment', 'charge'],
};

// Noise patterns
const NOISE_PATTERNS = [
  /taking\s+(my\s+)?break/i,
  /quick\s+bio/i,
  /bio\s+break/i,
  /rebooting/i,
  /restart(ing)?\s+(my\s+)?(computer|pc)/i,
  /brb/i,
  /be\s+right\s+back/i,
  /stepping\s+away/i,
  /^back$/i,
  /^back!$/i,
  /internet\s+outage/i,
  /^thank(s|\s+you)!?$/i,
  /^got\s+it!?$/i,
  /^sounds\s+good!?$/i,
  /^okay!?$/i,
  /^ok!?$/i,
];

// Protocol indicators
const PROTOCOL_PATTERNS = [
  /please\s+remember/i,
  /protocol/i,
  /do\s+the\s+following/i,
  /follow\s+these\s+steps/i,
  /should\s+not/i,
  /must\s+not/i,
  /cannot/i,
  /do\s+not/i,
  /don't/i,
  /must\s+be/i,
  /required\s+to/i,
  /make\s+sure\s+(to|you)/i,
  /always\s+ensure/i,
  /never\s+do/i,
];

// Incident indicators
const INCIDENT_PATTERNS = [
  /issue/i,
  /\bdown\b/i,
  /\berror\b/i,
  /not\s+working/i,
  /broken/i,
  /outage/i,
  /problem/i,
  /experiencing\s+issues/i,
  /temporarily\s+unavailable/i,
  /investigating/i,
  /resolved/i,
  /fixed/i,
];

// OOO/Staffing indicators
const STAFFING_PATTERNS = [
  /\booo\b/i,
  /out\s+of\s+office/i,
  /away\s+mode/i,
  /back\s+for\s+the\s+next/i,
  /stepping\s+out/i,
  /leaving\s+early/i,
  /working\s+from\s+home/i,
  /wfh/i,
  /sick\s+day/i,
  /pto/i,
  /vacation/i,
  /will\s+be\s+out/i,
  /covering\s+for/i,
];

// High priority indicators
const HIGH_PRIORITY_PATTERNS = [
  /important/i,
  /urgent/i,
  /hipaa/i,
  /immediately/i,
  /asap/i,
  /critical/i,
  /action\s+required/i,
  /do\s+not\s+do/i,
  /must\s+stop/i,
  /stop\s+doing/i,
];

/**
 * Extract tags from message body
 */
function extractTags(body: string): string[] {
  const tags: string[] = [];
  const lowerBody = body.toLowerCase();
  
  // Check controlled vocabulary
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerBody.includes(keyword)) {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
        break;
      }
    }
  }
  
  // Extract hashtags
  const hashtagMatches = body.match(/#[A-Za-z][A-Za-z0-9_-]*/g);
  if (hashtagMatches) {
    for (const hashtag of hashtagMatches) {
      if (!tags.includes(hashtag)) {
        tags.push(hashtag);
      }
    }
  }
  
  // Extract bracket tags [TAG]
  const bracketMatches = body.match(/\[([A-Z][A-Z0-9_-]+)\]/g);
  if (bracketMatches) {
    for (const bracket of bracketMatches) {
      const tag = bracket.slice(1, -1);
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  
  return tags;
}

/**
 * Generate a short title from the message body
 */
function generateTitle(body: string, category: UpdateCategory): string {
  // Take first line or first 80 characters
  const firstLine = body.split('\n')[0].trim();
  let title = firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
  
  // Clean up mentions for title
  title = title.replace(/@(channel|here|everyone)/g, '').trim();
  
  // If title is too short, use category
  if (title.length < 5) {
    title = `${category} Update`;
  }
  
  return title;
}

/**
 * Generate a 1-2 line summary
 */
function generateSummary(body: string): string {
  const lines = body.split('\n').filter(l => l.trim().length > 0);
  const summary = lines.slice(0, 2).join(' ').trim();
  
  if (summary.length > 200) {
    return summary.substring(0, 197) + '...';
  }
  
  return summary;
}

/**
 * Check if body matches any pattern in list
 */
function matchesPatterns(body: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(body));
}

/**
 * Determine the category for a message
 */
function classifyCategory(message: SlackMessage): UpdateCategory {
  const body = message.body;
  const hasChannelMention = message.mentions.some(m => 
    m === '@channel' || m === '@here' || m === '@everyone'
  );
  
  // Check for noise first (unless it has @channel)
  if (!hasChannelMention && !message.is_pinned_context) {
    if (matchesPatterns(body, NOISE_PATTERNS)) {
      return 'Noise';
    }
    // Very short messages without @channel are likely noise
    if (body.length < 20 && !matchesPatterns(body, PROTOCOL_PATTERNS) && !matchesPatterns(body, INCIDENT_PATTERNS)) {
      return 'Noise';
    }
  }
  
  // Check for staffing/OOO
  if (matchesPatterns(body, STAFFING_PATTERNS)) {
    // Unless it contains operational instructions
    if (!matchesPatterns(body, PROTOCOL_PATTERNS) && !hasChannelMention) {
      return 'Staffing/OOO';
    }
  }
  
  // Check for incidents
  if (matchesPatterns(body, INCIDENT_PATTERNS)) {
    if (hasChannelMention || message.is_pinned_context) {
      return 'Incident';
    }
    // Lower priority incident (FYI)
    return 'FYI';
  }
  
  // Check for protocols
  if (matchesPatterns(body, PROTOCOL_PATTERNS)) {
    return 'Protocol';
  }
  
  // Pinned content or @channel defaults to Announcement
  if (message.is_pinned_context || hasChannelMention) {
    return 'Announcement';
  }
  
  // Check for reminder patterns
  if (/reminder/i.test(body) || /don't forget/i.test(body) || /remember to/i.test(body)) {
    return 'Reminder';
  }
  
  // Default to FYI
  return 'FYI';
}

/**
 * Determine priority for a message
 */
function classifyPriority(message: SlackMessage, category: UpdateCategory): Priority {
  const body = message.body;
  const hasChannelMention = message.mentions.some(m => 
    m === '@channel' || m === '@here' || m === '@everyone'
  );
  
  // High priority conditions
  if (matchesPatterns(body, HIGH_PRIORITY_PATTERNS)) {
    return 'High';
  }
  
  if (hasChannelMention && (category === 'Protocol' || category === 'Incident')) {
    return 'High';
  }
  
  if (category === 'Incident' && message.is_pinned_context) {
    return 'High';
  }
  
  // Low priority conditions
  if (category === 'Noise' || category === 'Staffing/OOO') {
    return 'Low';
  }
  
  if (category === 'FYI' && !hasChannelMention) {
    return 'Low';
  }
  
  // Default to Med
  return 'Med';
}

/**
 * Classify a single SlackMessage into an UpdateItem
 */
export function classifyMessage(message: SlackMessage, date?: string | null): UpdateItem {
  const category = classifyCategory(message);
  const priority = classifyPriority(message, category);
  const tags = extractTags(message.body);
  const title = generateTitle(message.body, category);
  const summary = generateSummary(message.body);
  
  return {
    id: `update_${message.id}`,
    category,
    priority,
    title,
    summary,
    details: message.body,
    owner: message.author,
    mentions: message.mentions,
    links: message.links,
    tags,
    source_message_id: message.id,
    timestamp_text: message.timestamp_text,
    timestamp_minutes: message.timestamp_minutes,
    is_pinned: message.is_pinned_context,
    date: date || null,
  };
}

/**
 * Classify all messages into UpdateItems
 */
export function classifyMessages(messages: SlackMessage[], date?: string | null): UpdateItem[] {
  return messages.map(msg => classifyMessage(msg, date));
}

/**
 * Sort updates by priority (High first) then by time
 */
export function sortUpdates(updates: UpdateItem[]): UpdateItem[] {
  const priorityOrder: Record<Priority, number> = {
    'High': 0,
    'Med': 1,
    'Low': 2,
  };
  
  return [...updates].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by time (later first)
    const timeA = a.timestamp_minutes ?? 0;
    const timeB = b.timestamp_minutes ?? 0;
    return timeB - timeA;
  });
}

/**
 * Get all unique tags from updates
 */
export function getAllTags(updates: UpdateItem[]): string[] {
  const tagSet = new Set<string>();
  for (const update of updates) {
    for (const tag of update.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

/**
 * Get all unique authors from updates
 */
export function getAllAuthors(updates: UpdateItem[]): string[] {
  const authorSet = new Set<string>();
  for (const update of updates) {
    if (update.owner) {
      authorSet.add(update.owner);
    }
  }
  return Array.from(authorSet).sort();
}

/**
 * Get all unique dates from updates
 */
export function getAllDates(updates: UpdateItem[]): string[] {
  const dateSet = new Set<string>();
  for (const update of updates) {
    if (update.date) {
      dateSet.add(update.date);
    }
  }
  return Array.from(dateSet).sort().reverse(); // Most recent first
}

