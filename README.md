# Tahqiq - Arabic Transcript Editor

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/cbaed121-0d22-440a-bc93-70f59bcf3bb2.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/cbaed121-0d22-440a-bc93-70f59bcf3bb2)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/tahqiq)](https://tahqiq.vercel.app)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/tahqiq/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/tahqiq/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/tahqiq)

Tahqiq is a specialized web application for Arabic transcript editing and management. It provides a user-friendly interface for importing, editing, and exporting transcript data with support for right-to-left text and Arabic-specific formatting.

## Features

- **Arabic Text Support**: Built-in RTL direction and specialized handling for Arabic text
- **Transcript Import**: Drag-and-drop JSON transcript import
- **Segment Management**: Edit, merge, split, and delete transcript segments
- **Time Synchronization**: Edit start/end times for accurate transcript timing
- **Segment Status Tracking**: Mark segments as complete with visual indicators
- **Part Selection**: Navigate between different parts of a multi-part transcript
- **Text Formatting Options**: Configure formatting preferences for Arabic text
- **AI-Powered Translation**: Built-in translation capabilities using Google Gemini API

## Tech Stack

- [Next.js 15](https://nextjs.org/) with App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Google Generative AI](https://ai.google.dev/) for translation capabilities
- [Paragrafs](https://www.npmjs.com/package/paragrafs) for transcript segment handling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [Bun](https://bun.sh/) (recommended) or npm/yarn/pnpm

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
GOOGLE_GENAI_MODEL=gemini-pro
TRANSLATION_PROMPT=your_translation_prompt
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
    # or
    npm install
    ```

3. Start the development server:

    ```bash
    bun dev
    # or
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Import Transcript**: Drag and drop a JSON transcript file onto the import area
2. **Edit Segments**: Click on a segment's text area to edit its content
3. **Adjust Timing**: Edit the start/end time inputs to adjust segment timing
4. **Manage Segments**: Use the toolbar to merge, split, or delete selected segments
5. **Mark Completion**: Mark segments as done when finished editing
6. **Navigate Parts**: Use the part selector to switch between different transcript parts

## JSON Format

Tahqiq expects transcript data in the following format:

```json
{
    "contractVersion": "v1.0",
    "createdAt": "2024-10-01T12:00:00Z",
    "lastUpdatedAt": "2024-10-01T12:00:00Z",
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

## Development

### Project Structure

```
tahqiq/
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── lib/            # Utility functions
│   └── stores/         # Zustand state management
├── public/             # Static assets
└── ...                 # Config files
```

### Key Components

- `transcript.tsx`: Main transcript viewer component
- `segment-item.tsx`: Individual transcript segment component
- `useTranscriptStore.ts`: Zustand store for transcript state management
- `translate/route.ts`: API route for Google Gemini translation

### Testing

Run tests using Vitest:

```bash
bun test
# or
npm run test
```

## Deployment

The project is set up for seamless deployment on Vercel. Connect your GitHub repository to Vercel for automatic deployments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fragaeeb%2Ftahqiq)

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
