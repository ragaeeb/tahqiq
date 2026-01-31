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
- **Translation Progress Bar**: Visual indicator showing translated vs remaining items per tab
- **Search & Replace**: Powerful regex-based search and replace with token support (Arabic numerals, diacritics)
- **Unified Translation Workflow**: Consolidated excerpt selection and translation application into a single tabbed dialog
  - **Translation Picker**: Select untranslated excerpts in bulk for LLM processing
    - **High-Performance Rendering**: Efficiently handles 40k+ excerpt IDs using virtualization and memoization
    - **Arabic-Aware Token Estimation**: Accurate token counting accounting for tashkeel, tatweel, and Arabic numerals
    - **Context-Aware Limits**: Quick reference display for Grok 4, GPT-5.2, and Gemini 3 Pro token limits
    - **Flow Management**: Mark excerpts as "sent" to track translation progress across sessions
  - **Bulk Translation**: Paste translations in batch with automatic ID matching
    - **Model Selection**: Color-coded translator select (persisted per session)
    - **Validation**: Smart detection of duplicate IDs and overwrite warnings
    - **Validation UI**: Elegant grouping of errors by type with scrollable diagnostics for large batches
    - **Auto-Fix**: One-click "Wrench" button to automatically repair common translation formatting issues
- **Dynamic Tabs**: Footnotes tab only shows if the collection contains footnotes
- **URL-Based Filtering**: Shareable filter state via URL parameters
- **Hash-Based Scroll**: Navigate to specific rows via URL hash
  - `#2333` scrolls to excerpt with `from=2333` (page number)
  - `#P233` scrolls to excerpt/heading with `id=P233` or `id=C123`
- **Show in Context**: Quick toggle in filtered views to clear filters and jump to a specific row in full context
- **Neighbor Navigation**: Interactive buttons (ChevronUp/Down) that appear on hover to bring adjacent untranslated rows into the current filtered view without clearing filters
- **Gap Detection**: Intelligent logic to find "translation gaps" (1-3 consecutive missing items) surrounded by translated text, with quick-filter support
- **Safe Operations**: Destructive actions (Delete, Clear Translation) use `ConfirmButton` with visual cues to prevent data loss
- **Stability**: Intelligent virtualized list restoration preserves scroll position during book-wide deletions or merges
- **Extract to New Excerpt**: Select Arabic text and extract as a new excerpt
- **Inline Editing**: Edit Arabic (nass) and translation (text) fields directly
- **Headings ID Column**: Headings tab displays the ID field for easy reference
- **Short Segment Merging**: Proactively detects and suggests merging adjacent short segments (<30 words) on load

### Shamela Editor (`/shamela`)
- **Direct Download**: Download books from shamela.ws by pasting URL
- **JSON Import**: Drag and drop Shamela book JSON files
- **Page Editing**: Edit page content with body/footnote separation
- **Title Management**: Edit and organize book titles/chapters
- **Title-to-Page Navigation**: Click page/parent links in Titles tab to scroll to associated page
- **Hash-Based Scroll**: Navigate to specific pages via URL hash (e.g., `/shamela?tab=pages#123`)
- **Page Marker Cleanup**: Remove Arabic numeric page markers in batch
- **Patches System**: Track and export page edits as diffs for version control
- **Export**: Download edited books as JSON

### Web Editor (`/web`)
- **JSON Import**: Drag and drop scraped web content JSON files
- **ASL Book Loading**: Download books directly from the defined ASL Dataset by ID
- **External Links**: Click page IDs to open original source URLs (via `urlPattern` substitution)
- **Page Editing**: Edit page body content with line break preservation
- **Title Management**: View and edit titles derived from page data
- **Footnote Support**: Edit and remove footnotes
- **Segmentation**: Segment pages into excerpts for the Excerpts editor
- **Session Persistence**: Auto-save/restore from OPFS
- **Text Cleanup**: Batch remove Tatweel (kashida) characters from all page bodies
- **Export**: Download edited content as JSON

#### Segmentation Dialog
Powerful pattern-based page segmentation powered by [flappa-doormal](https://github.com/ragaeeb/flappa-doormal):

- **Analysis Tab**: Auto-analyze pages to detect common line start patterns with occurrence counts
  - Sort patterns by count or length
  - Common presets: Fasl, Basmalah, Naql, Kitab, Bab, Markdown headings
  - Add patterns from text selection
- **Rules Tab**: Configure segmentation rules with fine-grained control
  - Pattern types: `lineStartsWith`, `lineStartsAfter`, or `template`
  - Fuzzy matching for diacritic-insensitive matching
  - Page start guard to avoid false positives at page boundaries
  - Meta types: `book`, `chapter`, or `none` for segment classification
  - Merge multiple patterns into a single rule
  - Drag & drop reordering and sort by specificity
  - Live example preview showing rule matches
- **Replacements Tab**: Pre-processing regex replacements before segmentation
  - Define regex patterns and replacement strings
  - Live match count per pattern across all pages
  - Invalid regex detection with error highlighting
- **Token Mappings**: Auto-apply named capture groups (e.g., `{{raqms}}` → `{{raqms:num}}`)
- **Preview Tab**: Live virtualized preview of segmentation results
- **Errors Tab**: Validation report showing issues like page info mismatch or max pages violations
- **Json Tab**: View and edit raw segmentation options JSON with validation reporting

### Settings (`/settings`)
- **Gemini API Keys**: Configure multiple API keys for AI translation
- **HuggingFace Access Token**: Configure access to private datasets
- **ASL Dataset**: ID of the HuggingFace dataset for ASL books
- **Shamela Dataset**: ID of the HuggingFace dataset for Shamela books
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
- [@huggingface/hub](https://huggingface.co/docs/hub/js) for dataset integration
- [Shamela](https://www.npmjs.com/package/shamela) for Shamela library integration
- [Paragrafs](https://www.npmjs.com/package/paragrafs) for transcript segment handling
- [Baburchi](https://www.npmjs.com/package/baburchi) for Arabic text processing
- [Bitaboom](https://www.npmjs.com/package/bitaboom) for text cleanup and formatting
- [Flappa Doormal](https://github.com/ragaeeb/flappa-doormal) for pattern-based segmentation
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
3. **Track Progress**: View translation progress bar showing translated/total counts and percentages
4. **Filter Content**: Use the table header inputs to filter by page, Arabic text, or translation
5. **Edit Inline**: Click on any field to edit directly
6. **Search & Replace**: Use the search/replace dialog for bulk edits with regex support
7. **Unified Translation Workflow**: 
   - Click the languages button (🌐) in the toolbar to open the picker
   - Select pills (click range) → **Copy** prompt + excerpts for LLM
   - Click the plus button (+) in any row or the Add button in the header to jump to the **Add Translations** tab
   - Paste translations (format: `ID - Translation text`) → Review warnings → **Save**
   - Switch back to **Pick Excerpts** tab to continue the next batch
8. **Extract Text**: Select Arabic text and click "Extract as New Excerpt" to create a new entry
9. **URL Navigation**: Use `#P123` to scroll to ID, or `#123` to scroll to page number

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
4. **Navigate from Titles**: Click page numbers in Titles tab to jump to that page in Pages tab
5. **URL Hash Navigation**: Use `#123` in URL to scroll to specific page (e.g., `/shamela?tab=pages#123`)
6. **Clean Page Markers**: Click the eraser button to remove Arabic page markers
7. **Track Patches**: View and export page edit diffs via the patches dialog
8. **Save/Download**: Save to session storage or download as JSON

#### Segmentation Workflow

1. **Open Segmentation Dialog**: Click the segmentation button in the toolbar
2. **Analyze Patterns**: Auto-detection runs on first open; click "Analyze Pages" to refresh
3. **Select Patterns**: Click patterns in the Analysis tab to add them as rules
4. **Configure Rules**: In the Rules tab, adjust:
   - Pattern type (`lineStartsWith` / `lineStartsAfter` / `template`)
   - Enable fuzzy matching for diacritic tolerance
   - Enable page start guard to skip page-boundary matches
   - Set meta type for segment classification
5. **Add Replacements**: In the Replacements tab, add regex patterns to clean/normalize content before segmentation
6. **Configure Token Mappings**: In the Rules tab header, set global token → name mappings
7. **Preview Results**: Switch to Preview tab to see live segmentation output
8. **Review JSON**: Check the JSON tab for the final options object
9. **Finalize**: Click "Segment Pages" to generate excerpts and navigate to the Excerpts editor

### Web Editor (`/web`)

1. **Import Content**: Drag and drop a scraped web content JSON file
2. **Navigate Tabs**: Switch between Pages and Titles tabs
3. **View External Source**: Click page IDs to open the original URL (uses `urlPattern` substitution)
4. **Edit Content**: Click on body text to edit (line breaks are preserved)
5. **Edit Titles**: Switch to Titles tab to edit title content
6. **Remove Footnotes**: Click the footprints button to remove all footnotes
7. **Segment Pages**: Open segmentation panel to create excerpts
8. **Save/Download**: Save to session storage or download as JSON

### Settings (`/settings`)

1. **Gemini API Keys**: Click to reveal and edit API keys (one per line)
2. **Shamela Config**: Set your Shamela API key and books endpoint URL
3. **Quick Subs**: Add common text substitutions for the manuscript editor

## JSON Formats

### Web Content Format

```json
{
    "pages": [
        {
            "page": 1,
            "body": "السؤال: ...\nالإجابة: ...",
            "title": "Optional page title",
            "footnote": "Optional footnote",
            "url": "https://example.com/page/1"
        }
    ],
    "urlPattern": "https://example.com/page/{{page}}",
    "timestamp": "2025-02-25T03:48:03.030Z",
    "scrapingEngine": { "name": "jami-scrapi", "version": "2.1.0" }
}
```

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
│   │   ├── ajza/           # Manage groups of Juz for manuscript workflow
│   │   ├── api/            # API routes (huggingface, analytics, rules)
│   │   ├── book/           # Book browser and management
│   │   ├── excerpts/       # Excerpts management with virtualized lists
│   │   ├── ketab/          # Ketab-online book editor
│   │   ├── manuscript/     # Manuscript editing
│   │   ├── settings/       # Configuration UI
│   │   ├── shamela/        # Shamela book editor
│   │   ├── transcript/     # Audio transcript editing
│   │   └── web/            # Web content editor (scraped scholar content)
│   ├── components/         # Shared React components
│   │   ├── segmentation/   # Shared segmentation panel components
│   │   ├── hooks/          # Custom React hooks
│   │   └── ui/             # UI primitives (shadcn/ui style)
│   ├── lib/                # Utility functions
│   ├── stores/             # Zustand state management
│   │   ├── bookStore/      # Book compilation state
│   │   ├── excerptsStore/  # Excerpts state
│   │   ├── ketabStore/     # Ketab Online book state
│   │   ├── manuscriptStore/# Manuscript state
│   │   ├── patchStore/     # Page edit patches state
│   │   ├── segmentationStore/ # Segmentation panel state
│   │   ├── settingsStore/  # Settings and API keys
│   │   ├── shamelaStore/   # Shamela book state
│   │   ├── transcriptStore/# Transcript state
│   │   └── webStore/       # Web content state
│   └── test-utils/         # Testing utilities
├── AGENTS.md               # AI agent contribution guidelines
└── ...
```

### Key Patterns

- **State Management**: Zustand with Immer middleware for immutable updates
- **SSR Hydration**: Settings store initializes empty, hydrates from localStorage in useEffect
- **Dialog Pattern**: `DialogTriggerButton` with lazy `renderContent` callback; use `!max-w-[90vw]` for full-width dialogs
- **Component Library**: Always use ShadCN components from `@/components/ui/` over vanilla HTML elements
- **Virtualization**: `@tanstack/react-virtual` for large lists with scroll restoration
- **URL State**: Filter state persisted in URL search params, scroll targets in hash
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
