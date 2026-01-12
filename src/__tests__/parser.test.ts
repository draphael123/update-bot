import { 
  parseSlackText, 
  parseTimeToMinutes, 
  extractMentions, 
  extractLinks,
  extractAttachments,
  parseToBlocks,
} from '../lib/parser';
import { classifyMessages, classifyMessage } from '../lib/classifier';

// Sample Slack input that mimics the exact format described
const SAMPLE_SLACK_INPUT = `Jessica Booker
  11:13 AM
@channel Please remember to use the new protocol for LabCorp orders. All orders must include the patient's DOB in the notes field.

This is required for HIPAA compliance.

Lindsay Burden
  6:36 AM  replied to a thread:
Thanks, I'll update the macros.

Pinned by

Daniel Raphael
  9:45 AM
@channel Important update: The Quest scheduling link is temporarily down. Use the backup link until further notice.
https://backup.quest.com/schedule

image.png

Sarah Miller
  10:30 AM
Taking my break, brb

Canvas updated  7:51 AM

Mark Johnson
  8:15 AM
Quick bio break

Amanda Torres
  2:45 PM
@here We have a routing issue with Intercom tickets. Please do not accept new tickets until resolved.

Screenshot 2024-01-15.png

Tom Wilson
  3:00 PM
Restarting pc, will be back in 5

Jennifer Adams
  4:20 PM
OOO from 3pm-5pm for a doctor's appointment

Michael Chen
  5:00 PM
@channel Protocol reminder: When handling Employment Verification requests, you must verify the caller's identity before providing any information.

Steps to follow:
1. Ask for employee ID
2. Verify against system
3. Only then provide information

Lisa Park
  11:00 AM
Got it, thanks!`;

describe('Parser - parseTimeToMinutes', () => {
  test('parses AM time correctly', () => {
    expect(parseTimeToMinutes('11:13 AM')).toBe(673); // 11*60 + 13
  });

  test('parses PM time correctly', () => {
    expect(parseTimeToMinutes('2:45 PM')).toBe(885); // 14*60 + 45
  });

  test('handles 12 PM correctly', () => {
    expect(parseTimeToMinutes('12:00 PM')).toBe(720); // 12*60
  });

  test('handles 12 AM correctly', () => {
    expect(parseTimeToMinutes('12:00 AM')).toBe(0);
  });

  test('returns null for invalid format', () => {
    expect(parseTimeToMinutes('invalid')).toBeNull();
  });
});

describe('Parser - extractMentions', () => {
  test('extracts @channel mention', () => {
    const mentions = extractMentions('@channel Please remember to update');
    expect(mentions).toContain('@channel');
  });

  test('extracts @here mention', () => {
    const mentions = extractMentions('@here We have an issue');
    expect(mentions).toContain('@here');
  });

  test('extracts multiple mentions', () => {
    const mentions = extractMentions('@channel and @here please note');
    expect(mentions).toHaveLength(2);
    expect(mentions).toContain('@channel');
    expect(mentions).toContain('@here');
  });

  test('returns empty array when no mentions', () => {
    const mentions = extractMentions('No mentions here');
    expect(mentions).toHaveLength(0);
  });
});

describe('Parser - extractLinks', () => {
  test('extracts HTTP links', () => {
    const links = extractLinks('Check http://example.com for details');
    expect(links).toContain('http://example.com');
  });

  test('extracts HTTPS links', () => {
    const links = extractLinks('Visit https://backup.quest.com/schedule');
    expect(links).toContain('https://backup.quest.com/schedule');
  });

  test('extracts multiple links', () => {
    const links = extractLinks('See http://a.com and https://b.com');
    expect(links).toHaveLength(2);
  });
});

describe('Parser - extractAttachments', () => {
  test('extracts image.png', () => {
    const attachments = extractAttachments(['image.png', 'some text']);
    expect(attachments).toContain('image.png');
  });

  test('extracts Screenshot files', () => {
    const attachments = extractAttachments(['Screenshot 2024-01-15.png']);
    expect(attachments).toContain('Screenshot 2024-01-15.png');
  });

  test('ignores non-attachment lines', () => {
    const attachments = extractAttachments(['Just a normal message']);
    expect(attachments).toHaveLength(0);
  });
});

describe('Parser - parseSlackText', () => {
  let messages: ReturnType<typeof parseSlackText>;

  beforeAll(() => {
    messages = parseSlackText(SAMPLE_SLACK_INPUT);
  });

  test('parses correct number of messages', () => {
    // Should have messages for: Jessica Booker, Lindsay Burden, Daniel Raphael,
    // Sarah Miller, Mark Johnson, Amanda Torres, Tom Wilson, Jennifer Adams,
    // Michael Chen, Lisa Park
    // "Canvas updated" and "Pinned by" should NOT become messages
    expect(messages.length).toBe(10);
  });

  test('parses author "Jessica Booker" correctly', () => {
    const msg = messages.find(m => m.author === 'Jessica Booker');
    expect(msg).toBeDefined();
    expect(msg?.author).toBe('Jessica Booker');
  });

  test('parses author "Lindsay Burden" correctly', () => {
    const msg = messages.find(m => m.author === 'Lindsay Burden');
    expect(msg).toBeDefined();
  });

  test('parses author "Daniel Raphael" correctly', () => {
    const msg = messages.find(m => m.author === 'Daniel Raphael');
    expect(msg).toBeDefined();
  });

  test('captures attachments like "image.png"', () => {
    const msg = messages.find(m => m.author === 'Daniel Raphael');
    expect(msg?.attachments).toContain('image.png');
  });

  test('captures Screenshot attachments', () => {
    const msg = messages.find(m => m.author === 'Amanda Torres');
    expect(msg?.attachments.some(a => a.includes('Screenshot'))).toBe(true);
  });

  test('recognizes @channel mentions', () => {
    const msg = messages.find(m => m.author === 'Jessica Booker');
    expect(msg?.mentions).toContain('@channel');
  });

  test('recognizes @here mentions', () => {
    const msg = messages.find(m => m.author === 'Amanda Torres');
    expect(msg?.mentions).toContain('@here');
  });

  test('"Pinned by" should not become a message author', () => {
    const pinnedMessage = messages.find(m => m.author === 'Pinned by');
    expect(pinnedMessage).toBeUndefined();
  });

  test('"Canvas updated" should not become a message', () => {
    const canvasMessage = messages.find(m => 
      m.author?.includes('Canvas') || m.body.includes('Canvas updated')
    );
    expect(canvasMessage).toBeUndefined();
  });

  test('marks thread replies correctly', () => {
    const msg = messages.find(m => m.author === 'Lindsay Burden');
    expect(msg?.is_thread_reply).toBe(true);
  });

  test('marks pinned context correctly', () => {
    // Daniel Raphael's message should be marked as pinned (preceded by "Pinned by")
    const msg = messages.find(m => m.author === 'Daniel Raphael');
    expect(msg?.is_pinned_context).toBe(true);
  });

  test('extracts links from message body', () => {
    const msg = messages.find(m => m.author === 'Daniel Raphael');
    expect(msg?.links).toContain('https://backup.quest.com/schedule');
  });

  test('parses timestamp text correctly', () => {
    const msg = messages.find(m => m.author === 'Jessica Booker');
    expect(msg?.timestamp_text).toBe('11:13 AM');
  });

  test('converts timestamp to minutes', () => {
    const msg = messages.find(m => m.author === 'Jessica Booker');
    expect(msg?.timestamp_minutes).toBe(673);
  });
});

describe('Classifier', () => {
  let messages: ReturnType<typeof parseSlackText>;
  let updates: ReturnType<typeof classifyMessages>;

  beforeAll(() => {
    messages = parseSlackText(SAMPLE_SLACK_INPUT);
    updates = classifyMessages(messages);
  });

  test('classifies noise messages as Noise', () => {
    // "Taking my break" should be noise
    const sarahUpdate = updates.find(u => u.owner === 'Sarah Miller');
    expect(sarahUpdate?.category).toBe('Noise');

    // "Quick bio break" should be noise
    const markUpdate = updates.find(u => u.owner === 'Mark Johnson');
    expect(markUpdate?.category).toBe('Noise');

    // "Restarting pc" should be noise
    const tomUpdate = updates.find(u => u.owner === 'Tom Wilson');
    expect(tomUpdate?.category).toBe('Noise');

    // "Got it, thanks!" should be noise
    const lisaUpdate = updates.find(u => u.owner === 'Lisa Park');
    expect(lisaUpdate?.category).toBe('Noise');
  });

  test('classifies OOO as Staffing/OOO', () => {
    const jenniferUpdate = updates.find(u => u.owner === 'Jennifer Adams');
    expect(jenniferUpdate?.category).toBe('Staffing/OOO');
  });

  test('classifies @channel protocol as Protocol with High priority', () => {
    const michaelUpdate = updates.find(u => u.owner === 'Michael Chen');
    expect(michaelUpdate?.category).toBe('Protocol');
    expect(michaelUpdate?.priority).toBe('High');
  });

  test('classifies issue reports as Incident', () => {
    const amandaUpdate = updates.find(u => u.owner === 'Amanda Torres');
    // Has "issue" and @here, should be Incident
    expect(amandaUpdate?.category).toBe('Incident');
  });

  test('classifies pinned @channel announcement as Announcement or Protocol', () => {
    const danielUpdate = updates.find(u => u.owner === 'Daniel Raphael');
    // Has @channel and mentions "down", could be Incident
    expect(['Announcement', 'Incident']).toContain(danielUpdate?.category);
  });

  test('extracts tags from controlled vocabulary', () => {
    const jessicaUpdate = updates.find(u => u.owner === 'Jessica Booker');
    expect(jessicaUpdate?.tags).toContain('LabCorp');
    expect(jessicaUpdate?.tags).toContain('HIPAA');
  });

  test('assigns high priority to messages with HIPAA', () => {
    const jessicaUpdate = updates.find(u => u.owner === 'Jessica Booker');
    expect(jessicaUpdate?.priority).toBe('High');
  });

  test('assigns low priority to noise', () => {
    const noiseUpdates = updates.filter(u => u.category === 'Noise');
    noiseUpdates.forEach(u => {
      expect(u.priority).toBe('Low');
    });
  });

  test('generates title from message body', () => {
    const jessicaUpdate = updates.find(u => u.owner === 'Jessica Booker');
    expect(jessicaUpdate?.title).toBeTruthy();
    expect(jessicaUpdate?.title.length).toBeGreaterThan(0);
    expect(jessicaUpdate?.title.length).toBeLessThanOrEqual(80);
  });

  test('generates summary from message body', () => {
    const jessicaUpdate = updates.find(u => u.owner === 'Jessica Booker');
    expect(jessicaUpdate?.summary).toBeTruthy();
    expect(jessicaUpdate?.summary.length).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  test('handles empty input', () => {
    const messages = parseSlackText('');
    expect(messages).toHaveLength(0);
  });

  test('handles input with only system lines', () => {
    const input = `Pinned by
Canvas updated  7:51 AM`;
    const messages = parseSlackText(input);
    expect(messages).toHaveLength(0);
  });

  test('handles message without body', () => {
    const input = `John Doe
  10:00 AM`;
    const messages = parseSlackText(input);
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe('');
  });

  test('handles multiple consecutive messages', () => {
    const input = `User One
  9:00 AM
First message

User Two
  9:01 AM
Second message

User Three
  9:02 AM
Third message`;
    const messages = parseSlackText(input);
    expect(messages).toHaveLength(3);
  });

  test('handles message with multiple links', () => {
    const input = `John Doe
  10:00 AM
Check http://one.com and https://two.com for details`;
    const messages = parseSlackText(input);
    expect(messages[0].links).toHaveLength(2);
  });

  test('handles author names with apostrophes', () => {
    const input = `O'Brien Smith
  10:00 AM
Test message`;
    const messages = parseSlackText(input);
    expect(messages[0].author).toBe("O'Brien Smith");
  });

  test('handles author names with hyphens', () => {
    const input = `Mary-Jane Watson
  10:00 AM
Test message`;
    const messages = parseSlackText(input);
    expect(messages[0].author).toBe('Mary-Jane Watson');
  });
});

