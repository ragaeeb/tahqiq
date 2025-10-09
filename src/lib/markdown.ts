import type { TextLine } from '@/stores/manuscriptStore/types';

export const mapTextLineToMarkdown = (o: TextLine): TextLine => {
    const text = o.isHeading ? `#${o.text}` : o.text;
    return { ...o, text };
};
