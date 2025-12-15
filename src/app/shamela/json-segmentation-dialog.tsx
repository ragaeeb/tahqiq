'use client';

import type { SegmentationOptions } from 'flappa-doormal';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
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
import { saveCompressed } from '@/lib/io';
import { DEFAULT_OPTIONS, segmentShamelaPagesToExcerpts } from '@/lib/transform/excerpts';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';
import { useShamelaStore } from '@/stores/shamelaStore/useShamelaStore';

/**
 * Simple JSON-based segmentation dialog that allows pasting segmentation options directly
 */
export function JsonSegmentationDialogContent() {
    const router = useRouter();
    const [jsonText, setJsonText] = useState(DEFAULT_OPTIONS);
    const [error, setError] = useState<string | null>(null);

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

    // Finalize and navigate to excerpts
    const handleFinalize = useCallback(async () => {
        const options = parseOptions();
        if (!options) {
            return;
        }

        record('FinalizeJsonSegmentation');

        try {
            toast.info('Segmenting pages...');

            const excerpts = segmentShamelaPagesToExcerpts(
                useShamelaStore.getState().pages,
                useShamelaStore.getState().titles,
                options,
            );

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
    }, [parseOptions, router]);

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Segment Pages (JSON)</DialogTitle>
                <DialogDescription>Paste segmentation options as JSON.</DialogDescription>
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
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleFinalize}>Segment Pages</Button>
            </DialogFooter>
        </DialogContent>
    );
}
