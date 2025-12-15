'use client';

import { sanitizeArabic } from 'baburchi';
import { type Page, type SegmentationOptions, segmentPages } from 'flappa-doormal';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LatestContractVersion } from '@/lib/constants';
import { saveCompressed } from '@/lib/io';
import { preformatArabicText } from '@/lib/textUtils';
import type { Excerpts } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import type { ShamelaPage } from '@/stores/shamelaStore/types';

const DEFAULT_OPTIONS = `{
    "breakpoints": [{ "pattern": "{{tarqim}}\\\\s*" }, ""],
    "maxPages": 1,
    "prefer": "longer",
    "rules": [
        {
            "fuzzy": true,
            "lineStartsWith": ["{{basmalah}}"],
            "split": "at"
        },
        {
            "fuzzy": true,
            "lineStartsWith": ["{{bab}}"],
            "meta": { "type": "chapter" },
            "split": "at"
        },
        {
            "lineStartsAfter": ["##"],
            "meta": { "type": "chapter" },
            "split": "at"
        },
        {
            "fuzzy": true,
            "lineStartsWith": ["{{kitab}}"],
            "meta": { "type": "book" },
            "split": "at"
        },
        {
            "lineStartsAfter": ["{{raqms:num}} {{dash}}"],
            "split": "at"
        }
    ]
}`;

const STORAGE_KEY = 'shamela-segmentation-json';

type JsonSegmentationDialogContentProps = { pages: ShamelaPage[] };

const htmlToMarkdown = (html: string): string => {
    return (
        html
            // Move content after line break (or at start) but before title span INTO the span
            .replace(/(^|\r)([^\r]*?)<span[^>]*data-type=["']title["'][^>]*>/gi, '$1<span data-type="title">$2')
            // Convert title spans to markdown headers
            .replace(/<span[^>]*data-type=["']title["'][^>]*>(.*?)<\/span>/gi, '## $1')
            // Strip narrator links but keep text
            .replace(/<a[^>]*href=["']inr:\/\/[^"']*["'][^>]*>(.*?)<\/a>/gi, '$1')
            // Strip all remaining HTML tags
            .replace(/<[^>]*>/g, '')
            .replace(/舄/g, '')
    );
};

/**
 * Simple JSON-based segmentation dialog that allows pasting segmentation options directly
 */
export function JsonSegmentationDialogContent({ pages }: JsonSegmentationDialogContentProps) {
    const router = useRouter();
    const [jsonText, setJsonText] = useState(() => {
        // Try to load from localStorage, fall back to default
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return saved;
            }
        }
        return DEFAULT_OPTIONS;
    });
    const [error, setError] = useState<string | null>(null);

    // Process pages for segmentation (convert HTML to markdown)
    const processedPages = useMemo((): Page[] => {
        return pages.map((p) => {
            const content = htmlToMarkdown(p.body);
            return { content, id: p.id };
        });
    }, [pages]);
    console.log('processedPages', processedPages);

    // Parse JSON and validate
    const parseOptions = useCallback((): SegmentationOptions | null => {
        try {
            const options = JSON.parse(jsonText) as SegmentationOptions;
            setError(null);
            return options;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
            return null;
        }
    }, [jsonText]);

    // Save JSON to localStorage
    const handleSave = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, jsonText);
            toast.success('Options saved');
        } catch {
            toast.error('Failed to save options');
        }
    }, [jsonText]);

    // Finalize and navigate to excerpts
    const handleFinalize = useCallback(async () => {
        const options = parseOptions();
        if (!options) {
            return;
        }

        record('FinalizeJsonSegmentation');

        try {
            toast.info('Segmenting pages...');

            let idCount = 0;
            const excerpts: Excerpts = {
                contractVersion: LatestContractVersion.Excerpts,
                excerpts: segmentPages(processedPages, options)
                    .filter((s) => {
                        return sanitizeArabic(s.content, 'aggressive').length > 2;
                    })
                    .map((s) => ({
                        from: s.from,
                        ...(s.to && { to: s.to }),
                        id: `P${++idCount}`,
                        lastUpdatedAt: Date.now() / 1000,
                        ...(s.meta && { meta: s.meta }),
                        nass: preformatArabicText(s.content),
                        text: '',
                        translator: 879,
                        vol: 1,
                        vp: 1,
                    })),
                footnotes: [],
                headings: [],
            };

            // Save JSON for future use
            handleSave();

            try {
                await saveCompressed('excerpts', excerpts);
            } catch (err) {
                console.warn('Failed to save excerpts to storage, loading directly into store:', err);
                useExcerptsStore.getState().init(excerpts);
            }

            router.push('/excerpts');
            toast.success(`Created ${excerpts.excerpts.length} segments`);
        } catch (err) {
            console.error('Segmentation failed:', err);
            toast.error(`Segmentation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [processedPages, parseOptions, router, handleSave]);

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Segment Pages (JSON)</DialogTitle>
                <DialogDescription>Paste segmentation options as JSON. {pages.length} pages loaded.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="json-options">Segmentation Options (JSON)</Label>
                    <Textarea
                        className="mt-2 h-80 font-mono text-sm"
                        id="json-options"
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            setError(null);
                        }}
                        placeholder="Paste JSON options here..."
                        value={jsonText}
                    />
                </div>

                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
            </div>

            <DialogFooter className="gap-2">
                <Button onClick={handleSave} variant="outline">
                    Save Options
                </Button>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleFinalize}>Segment Pages</Button>
            </DialogFooter>
        </DialogContent>
    );
}
