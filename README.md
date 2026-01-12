# IC Updates

A Next.js web application for parsing and organizing Slack messages from the IC team channel into structured, filterable updates with document generation capabilities.

## Features

- **Parse Slack Messages**: Copy/paste raw Slack text and automatically parse it into structured messages
- **Smart Classification**: Rule-based classifier categorizes messages into:
  - Announcements
  - Protocols
  - Incidents
  - Reminders
  - FYI
  - Staffing/OOO
  - Noise (filtered out by default)
- **Priority Detection**: Automatically assigns High/Med/Low priority based on content analysis
- **Filterable Updates Feed**: Filter by category, priority, tags, authors, and @channel/@here mentions
- **Document Generator**: Create formatted update documents in multiple formats:
  - Daily IC Update
  - Weekly IC Summary
  - Leadership Digest
- **Export Options**: Download as Markdown (.md) or Word Document (.docx)
- **Persistence**: Last parsed data is saved to localStorage
- **Import/Export**: Export parsed data as JSON for backup or sharing

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository or navigate to the project directory:

```bash
cd ic-updates
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
npm test
# or
npm run test:watch  # for watch mode
```

## Usage

### Parsing Slack Messages

1. Copy messages from your Slack #ic-team channel
2. Paste the text into the input area on the left
3. Click "Parse Messages"
4. View the structured updates in the "Updates Feed" tab

### Supported Input Format

The parser expects Slack messages in this format:

```
AuthorName
  11:13 AM
Message body text...

Another Author
  6:36 AM  replied to a thread:
Reply message text...

Pinned by

Pinned Message Author
  9:45 AM
@channel Important announcement...
```

The parser handles:
- Author names with spaces (e.g., "Jessica Booker")
- Timestamps in 12-hour format (e.g., "11:13 AM", "6:36 PM")
- Thread replies (indicated by "replied to a thread:")
- Pinned messages (preceded by "Pinned by" line)
- @channel, @here, @everyone mentions
- Image attachments (image.png, Screenshot....png)
- Links (http/https URLs)
- System lines like "Canvas updated" (ignored)

### Filtering Updates

In the Updates Feed tab:
- Click filter chips to filter by category or priority
- Use the search box to find specific content
- Toggle "Only @channel/@here mentions" to see important broadcasts
- Select specific authors or tags

### Generating Documents

1. Go to the "Document Generator" tab
2. Select a template (Daily IC Update, Weekly IC Summary, or Leadership Digest)
3. Optionally set a date for the document
4. Use the action buttons to:
   - Preview Markdown
   - Copy Markdown to clipboard
   - Download as .md file
   - Download as .docx file

## Classification Rules

### Categories

| Category | Triggers |
|----------|----------|
| Announcement | @channel mention, pinned content |
| Protocol | "please remember", "protocol", "must", "should not", "do not" |
| Incident | "issue", "down", "error", "not working", with @channel |
| Reminder | "reminder", "don't forget", "remember to" |
| Staffing/OOO | "OOO", "out of office", "away mode", "PTO" |
| Noise | "taking break", "bio break", "restarting pc", "brb" |
| FYI | Default for other messages |

### Priority

| Priority | Conditions |
|----------|------------|
| High | @channel + Protocol/Incident, "important", "urgent", "HIPAA" |
| Med | Announcements without strict instructions |
| Low | FYI, Staffing/OOO, Noise |

### Tag Extraction

The classifier extracts tags from a controlled vocabulary:
- LabCorp, Quest, Akute, Intercom
- Scheduling, Macros, Routing
- Employment Verification, HRT Intake
- HIPAA, Subscription, Video Visit
- Plus any #hashtags or [BRACKET_TAGS] in the message

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel](https://vercel.com) and sign in

3. Click "New Project" and import your repository

4. Vercel will automatically detect Next.js and configure the build settings

5. Click "Deploy"

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Environment Variables

This application doesn't require any environment variables. All data is stored locally in the browser's localStorage.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **DOCX Generation**: docx npm package
- **Testing**: Jest + ts-jest

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles and Tailwind config
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main application page
├── components/
│   ├── DetailPanel.tsx      # Update detail side panel
│   ├── DocumentGenerator.tsx # Document generation UI
│   ├── FilterBar.tsx        # Filter controls
│   ├── PasteInput.tsx       # Text input area
│   ├── RawMessages.tsx      # Debug view of parsed messages
│   ├── UpdateCard.tsx       # Individual update card
│   └── UpdatesFeed.tsx      # Main updates list
├── lib/
│   ├── classifier.ts    # Message classification logic
│   ├── docx-generator.ts # DOCX/Markdown generation
│   ├── parser.ts        # Slack text parser
│   ├── storage.ts       # localStorage utilities
│   └── types.ts         # TypeScript interfaces
└── __tests__/
    └── parser.test.ts   # Parser and classifier tests
```

## License

MIT

