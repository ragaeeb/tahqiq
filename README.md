# Tahqiq - Islamic Text Editor & Manuscript Manager

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/cbaed121-0d22-440a-bc93-70f59bcf3bb2.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/cbaed121-0d22-440a-bc93-70f59bcf3bb2)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/tahqiq)](https://tahqiq.vercel.app)
[![codecov](https://codecov.io/gh/ragaeeb/tahqiq/graph/badge.svg?token=PIE9CAHBOE)](https://codecov.io/gh/ragaeeb/tahqiq)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/tahqiq/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/tahqiq/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/tahqiq)

Tahqiq is a comprehensive web application for managing Islamic texts, manuscripts, and audio transcripts. It provides specialized tools for Arabic text editing, translation management, and browsable content generation for Qur'an and Hadith collections.

## Features

### Transcript Editing
- **Arabic Text Support**: Built-in RTL direction and specialized handling for Arabic text
- **Segment Management**: Edit, merge, split, and delete transcript segments
- **Time Synchronization**: Edit start/end times for accurate transcript timing
- **Segment Status Tracking**: Mark segments as complete with visual indicators
- **Ground Truth Grounding**: Apply reference text to correct transcription errors
- **Text Formatting Options**: Configure formatting preferences for Arabic text

### Excerpts Management
- **Virtualized Lists**: Efficiently handle thousands of excerpts with smooth scrolling
- **Three-Tab Interface**: Manage excerpts, headings, and footnotes separately
- **Search & Replace**: Powerful regex-based search and replace with token support (Arabic numerals, diacritics)
- **URL-Based Filtering**: Shareable filter state via URL parameters
- **Extract to New Excerpt**: Select Arabic text and extract as a new excerpt
- **Inline Editing**: Edit Arabic (nass) and translation (text) fields directly

### Shamela Editor (`/shamela`)
- **Direct Download**: Download books from shamela.ws by pasting URL
- **JSON Import**: Drag and drop Shamela book JSON files
- **Page Editing**: Edit page content with body/footnote separation
- **Title Management**: Edit and organize book titles/chapters
- **Page Marker Cleanup**: Remove Arabic numeric page markers in batch
- **Export**: Download edited books as JSON

### Settings (`/settings`)
- **Gemini API Keys**: Configure multiple API keys for AI translation
- **Shamela Configuration**: Set up API key and endpoint for book downloads
- **Quick Substitutions**: Configure common text replacements

### Manuscript Processing
- **OCR Correction**: Edit and correct Arabic manuscript scans
- **Poetry Alignment**: Specialized handling for poetic text alignment
- **Heading Detection**: Mark rows as headings with hierarchy support
- **Similar Line Finding**: Find similar lines using configurable thresholds

### Book Browsing
- **Static Generation**: Pre-rendered browsable pages for Islamic texts
- **Qur'an & Hadith**: Support for multiple content types and collections
- **Hierarchical Navigation**: Browse by volume, chapter, and content

### AI-Powered Translation
- **Google Gemini Integration**: Built-in translation capabilities
- **Batch Translation**: Translate multiple segments at once
- **Translation Preview**: Review AI translations before applying

## Tech Stack

- [Next.js 16](https://nextjs.org/) with App Router and Turbopack
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) + [Immer](https://immerjs.github.io/immer/) for state management
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [@tanstack/react-virtual](https://tanstack.com/virtual) for virtualized lists
- [Google Generative AI](https://ai.google.dev/) for translation capabilities
- [Shamela](https://www.npmjs.com/package/shamela) for Shamela library integration
- [Paragrafs](https://www.npmjs.com/package/paragrafs) for transcript segment handling
- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) + [happy-dom](https://github.com/capricorn86/happy-dom) for component tests

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v24 or later)
- [Bun](https://bun.sh/) (v1.3.2 or later)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
GOOGLE_GENAI_MODEL=gemini-pro
TRANSLATION_PROMPT=your_translation_prompt
RULES_ENDPOINT=your_rules_endpoint_url
```

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/ragaeeb/tahqiq.git
    cd tahqiq
    ```

2. Install dependencies:

    ```bash
    bun install
    ```

3. Start the development server:

    ```bash
    bun dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Transcript Editor (`/transcript`)

1. **Import Transcript**: Drag and drop a JSON transcript file onto the import area
2. **Edit Segments**: Click on a segment's text area to edit its content
3. **Adjust Timing**: Edit the start/end time inputs to adjust segment timing
4. **Merge Segments**: Select two segments and click merge to combine them
5. **Split Segments**: Click on a token within a segment to split at that point
6. **Mark Completion**: Mark segments as done when finished editing

### Excerpts Editor (`/excerpts`)

1. **Import Excerpts**: Load an excerpts JSON file via the toolbar
2. **Navigate Tabs**: Switch between Excerpts, Headings, and Footnotes tabs
3. **Filter Content**: Use the table header inputs to filter by page, Arabic text, or translation
4. **Edit Inline**: Click on any field to edit directly
5. **Search & Replace**: Use the search/replace dialog for bulk edits with regex support
6. **Extract Text**: Select Arabic text and click "Extract as New Excerpt" to create a new entry

### Manuscript Editor (`/manuscript`)

1. **Upload Manuscript**: Load manuscript JSON data
2. **Correct OCR**: Edit the "alt" column to correct OCR errors
3. **Mark Headings**: Use the menu to mark rows as headings
4. **Merge Rows**: Combine multiple rows into one
5. **Find Similar**: Search for similar lines in the manuscript

### Shamela Editor (`/shamela`)

1. **Import Book**: Either paste a shamela.ws URL or drag and drop a JSON file
2. **Navigate Tabs**: Switch between Pages and Titles tabs
3. **Edit Content**: Click on fields to edit page body, footnotes, or title content
4. **Clean Page Markers**: Click the eraser button to remove Arabic page markers
5. **Save/Download**: Save to session storage or download as JSON

### Settings (`/settings`)

1. **Gemini API Keys**: Click to reveal and edit API keys (one per line)
2. **Shamela Config**: Set your Shamela API key and books endpoint URL
3. **Quick Subs**: Add common text substitutions for the manuscript editor

## JSON Formats

### Transcript Format

```json
{
    "contractVersion": "v1.0",
    "createdAt": "2024-10-01T12:00:00Z",
    "transcripts": [
        {
            "segments": [
                {
                    "start": 0,
                    "end": 10,
                    "text": "Arabic transcript text",
                    "status": "done"
                }
            ],
            "timestamp": "2024-10-01T12:00:00Z",
            "volume": 1.0
        }
    ]
}
```

### Excerpts Format

```json
{
    "contractVersion": "v3.1",
    "collection": "bukhari",
    "excerpts": [
        {
            "id": "E1",
            "from": 1,
            "to": 2,
            "nass": "النص العربي",
            "text": "Translation text"
        }
    ],
    "headings": [
        {
            "id": "H1",
            "from": 1,
            "nass": "عنوان الباب",
            "text": "Chapter Title",
            "parent": "H0"
        }
    ],
    "footnotes": [
        {
            "id": "F1",
            "from": 5,
            "nass": "حاشية",
            "text": "Footnote text"
        }
    ]
}
```

## Development

### Project Structure

```text
tahqiq/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API routes (shamela, translate, analytics)
│   │   ├── book/           # Book viewing and translation
│   │   ├── browse/         # Static browsable content
│   │   ├── excerpts/       # Excerpts management
│   │   ├── manuscript/     # Manuscript editing
│   │   ├── settings/       # Configuration UI
│   │   ├── shamela/        # Shamela book editor
│   │   └── transcript/     # Audio transcript editing
│   ├── components/         # Shared React components
│   │   ├── hooks/          # Custom React hooks
│   │   └── ui/             # UI primitives (shadcn/ui style)
│   ├── lib/                # Utility functions
│   ├── stores/             # Zustand state management
│   │   ├── excerptsStore/  # Excerpts state
│   │   ├── manuscriptStore/# Manuscript state
│   │   ├── settingsStore/  # Settings and API keys
│   │   ├── shamelaStore/   # Shamela book state
│   │   └── transcriptStore/# Transcript state
│   └── test-utils/         # Testing utilities
├── AGENTS.md               # AI agent contribution guidelines
└── ...
```

### Key Patterns

- **State Management**: Zustand with Immer middleware for immutable updates
- **SSR Hydration**: Settings store initializes empty, hydrates from localStorage in useEffect
- **Dialog Pattern**: `DialogTriggerButton` with lazy `renderContent` callback
- **Virtualization**: `@tanstack/react-virtual` for large lists with scroll restoration
- **URL State**: Filter state persisted in URL search params
- **API Security**: Sensitive data (API keys) passed in headers, not query params

### Testing

Run tests with Bun's built-in runner:

```bash
# Run all tests with coverage
bun test --coverage

# Run specific test files
bun test src/stores/excerptsStore/
bun test src/app/excerpts/

# Run in watch mode
bun test --watch
```

### Code Quality

```bash
# Lint and format
bunx biome check --apply .

# Type check + build
bun run build
```

### Production Build

Always verify production builds locally before pushing:

```bash
bun run build
```

## Deployment

The project is set up for seamless deployment on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fragaeeb%2Ftahqiq)

## AI Agent Guidelines

See [AGENTS.md](AGENTS.md) for comprehensive guidelines on contributing to this project, including:
- Architecture and patterns
- State management conventions
- Testing strategies
- Code style requirements

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`bun test`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request
