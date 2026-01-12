import { SlackMessage, ParsedBlock } from './types';

// Regex patterns
const AUTHOR_LINE_PATTERN = /^[A-Za-z][A-Za-z\s'-]+$/;
const TIME_LINE_PATTERN = /^\s{2,}(\d{1,2}:\d{2}\s?(AM|PM|am|pm))/;
const PINNED_BY_PATTERN = /^Pinned by/i;
const CANVAS_UPDATED_PATTERN = /^Canvas updated/i;
const ATTACHMENT_PATTERN = /\.(png|jpg|jpeg|gif|pdf|doc|docx|xlsx|csv)$/i;
const LINK_PATTERN = /https?:\/\/[^\s<>)]+/g;
const MENTION_PATTERN = /@(channel|here|everyone|[A-Za-z][A-Za-z\s'-]+)/g;
const THREAD_REPLY_PATTERN = /replied to a thread/i;

/**
 * Parse timestamp text to minutes since midnight
 */
export function parseTimeToMinutes(timeText: string): number | null {
  const match = timeText.match(/(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)/);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentions: string[] = [];
  const matches = text.matchAll(MENTION_PATTERN);
  for (const match of matches) {
    const mention = `@${match[1]}`;
    if (!mentions.includes(mention)) {
      mentions.push(mention);
    }
  }
  return mentions;
}

/**
 * Extract links from text
 */
export function extractLinks(text: string): string[] {
  const links: string[] = [];
  const matches = text.matchAll(LINK_PATTERN);
  for (const match of matches) {
    if (!links.includes(match[0])) {
      links.push(match[0]);
    }
  }
  return links;
}

/**
 * Check if a line is an attachment reference
 */
export function isAttachmentLine(line: string): boolean {
  const trimmed = line.trim();
  if (ATTACHMENT_PATTERN.test(trimmed)) return true;
  if (trimmed.toLowerCase().startsWith('screenshot') && 
      (trimmed.includes('.png') || trimmed.includes('.jpg'))) {
    return true;
  }
  return false;
}

/**
 * Extract attachment filenames from lines
 */
export function extractAttachments(lines: string[]): string[] {
  const attachments: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (isAttachmentLine(trimmed)) {
      attachments.push(trimmed);
    }
  }
  return attachments;
}

/**
 * Check if a line should be skipped (system line, not a message)
 */
function isSystemLine(line: string): boolean {
  const trimmed = line.trim();
  if (PINNED_BY_PATTERN.test(trimmed)) return true;
  if (CANVAS_UPDATED_PATTERN.test(trimmed)) return true;
  return false;
}

/**
 * Check if a line is a valid author line
 */
function isAuthorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSystemLine(trimmed)) return false;
  if (isAttachmentLine(trimmed)) return false;
  // Author line should be at the start (no leading whitespace) and match name pattern
  if (line !== trimmed) return false; // Has leading whitespace
  return AUTHOR_LINE_PATTERN.test(trimmed);
}

/**
 * Check if a line is a time line (indented timestamp)
 */
function isTimeLine(line: string): boolean {
  return TIME_LINE_PATTERN.test(line);
}

/**
 * Parse the raw pasted text into message blocks
 */
export function parseToBlocks(rawText: string): ParsedBlock[] {
  const lines = rawText.split('\n');
  const blocks: ParsedBlock[] = [];
  
  let currentBlock: ParsedBlock | null = null;
  let isPinnedContext = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for "Pinned by" - sets context for next message
    if (PINNED_BY_PATTERN.test(trimmedLine)) {
      isPinnedContext = true;
      continue;
    }
    
    // Skip Canvas updated lines
    if (CANVAS_UPDATED_PATTERN.test(trimmedLine)) {
      continue;
    }
    
    // Check for author line followed by time line
    if (isAuthorLine(line) && i + 1 < lines.length && isTimeLine(lines[i + 1])) {
      // Save previous block if exists
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      
      // Extract time info
      const timeMatch = lines[i + 1].match(TIME_LINE_PATTERN);
      const timestampText = timeMatch ? timeMatch[1] : null;
      const isThreadReply = THREAD_REPLY_PATTERN.test(lines[i + 1]);
      
      // Start new block
      currentBlock = {
        author: trimmedLine,
        timestamp_text: timestampText,
        body_lines: [],
        raw_lines: [line, lines[i + 1]],
        is_thread_reply: isThreadReply,
        is_pinned_context: isPinnedContext,
      };
      
      isPinnedContext = false; // Reset after using
      i++; // Skip the time line
      continue;
    }
    
    // Add line to current block's body
    if (currentBlock) {
      currentBlock.body_lines.push(line);
      currentBlock.raw_lines.push(line);
    }
  }
  
  // Don't forget the last block
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert parsed blocks to SlackMessage objects
 */
export function blocksToMessages(blocks: ParsedBlock[]): SlackMessage[] {
  return blocks.map((block) => {
    const body = block.body_lines
      .filter(line => !isAttachmentLine(line.trim()))
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    const allText = block.body_lines.join('\n');
    
    return {
      id: generateId(),
      author: block.author,
      timestamp_text: block.timestamp_text,
      timestamp_minutes: block.timestamp_text ? parseTimeToMinutes(block.timestamp_text) : null,
      is_thread_reply: block.is_thread_reply,
      is_pinned_context: block.is_pinned_context,
      mentions: extractMentions(allText),
      body: body,
      links: extractLinks(allText),
      attachments: extractAttachments(block.body_lines),
      raw_block: block.raw_lines.join('\n'),
    };
  });
}

/**
 * Main parser function - parse raw Slack text into SlackMessage array
 */
export function parseSlackText(rawText: string): SlackMessage[] {
  const blocks = parseToBlocks(rawText);
  return blocksToMessages(blocks);
}

